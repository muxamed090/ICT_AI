"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { EconomicEventsRepository } from '@/lib/repositories/EconomicEventsRepository'
import { AiDecisionRepository } from '@/lib/repositories/AiDecisionRepository'
import { SignalRepository } from '@/lib/repositories/SignalRepository'
import { AiDecisionEngine } from '@/lib/services/AiDecisionEngine'
import { marketSnapshotSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { DecisionResult, MarketSnapshot, AiDecision } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

/**
 * Executes a simulated decision without writing to the database history log.
 */
export async function runAiDecisionAction(
  snapshot: unknown,
  accountBalance: number,
  activeDrawdown: number = 0.0
): Promise<ActionResult<DecisionResult>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validatedSnapshot = marketSnapshotSchema.parse(snapshot) as MarketSnapshot

    // Get User rules configurations
    const rulesRepo = new IctRulesRepository(supabase)
    const rules = await rulesRepo.getByUser(user.id)

    // Get settings
    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    if (!settings) {
      return { success: false, error: { type: 'database', message: 'User settings configuration not found.' } }
    }

    // Get Economic calendar events
    const economicRepo = new EconomicEventsRepository(supabase)
    const events = await economicRepo.getAll()

    // Run Decision Engine
    const decision = AiDecisionEngine.evaluate(
      validatedSnapshot,
      rules,
      settings,
      events,
      accountBalance,
      activeDrawdown
    )

    return { success: true, data: decision }
  } catch (err) {
    return handleActionError<DecisionResult>(err)
  }
}

/**
 * Saves the AI decision to the history log and generates a Signal if the decision is ENTRY.
 */
export async function saveDecisionAndGenerateSignalAction(
  snapshot: unknown,
  decisionResult: DecisionResult
): Promise<ActionResult<{ decision: AiDecision; signalGenerated: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validatedSnapshot = marketSnapshotSchema.parse(snapshot) as MarketSnapshot

    // 1. Write to ai_decisions history log
    const decisionRepo = new AiDecisionRepository(supabase)
    const savedDecision = await decisionRepo.create({
      user_id: user.id,
      snapshot: validatedSnapshot as unknown as Record<string, unknown>,
      decision_result: decisionResult as unknown as Record<string, unknown>,
      model_version: 'ICT-AI-v1'
    })

    let signalGenerated = false

    // 2. Generate a trade Signal if execution decision is ENTRY
    if (decisionResult.decision === 'ENTRY' && decisionResult.positionCalculation) {
      const signalRepo = new SignalRepository(supabase)
      await signalRepo.create({
        user_id: user.id,
        pair: validatedSnapshot.pair,
        direction: decisionResult.marketBias === 'bullish' ? 'buy' : 'sell',
        score: decisionResult.confluenceScore,
        confidence: decisionResult.confidence,
        entry: decisionResult.positionCalculation.entryPrice,
        stop_loss: decisionResult.positionCalculation.stopLossPrice,
        tp1: decisionResult.positionCalculation.tp1,
        tp2: decisionResult.positionCalculation.tp2,
        status: 'active'
      })
      signalGenerated = true
    }

    revalidatePath('/dashboard/decision-engine')
    revalidatePath('/dashboard/signals')
    revalidatePath('/dashboard')

    return { 
      success: true, 
      data: { 
        decision: savedDecision, 
        signalGenerated 
      } 
    }
  } catch (err) {
    return handleActionError<{ decision: AiDecision; signalGenerated: boolean }>(err)
  }
}
