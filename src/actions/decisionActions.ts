"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { EconomicEventsRepository } from '@/lib/repositories/EconomicEventsRepository'
import { AiDecisionRepository } from '@/lib/repositories/AiDecisionRepository'
import { SignalRepository } from '@/lib/repositories/SignalRepository'
import { MlModelRegistryRepository } from '@/lib/repositories/MlModelRegistryRepository'
import { MlPredictionRepository } from '@/lib/repositories/MlPredictionRepository'
import { AiDecisionEngine } from '@/lib/services/AiDecisionEngine'
import { MlFeatureExtractor } from '@/lib/services/MlFeatureExtractor'
import { marketSnapshotSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { HybridDecisionResult, MarketSnapshot, AiDecision } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

/**
 * Executes a simulated decision without writing to the database history log.
 * Fetches the active ML model and runs the full 5-step pipeline.
 */
export async function runAiDecisionAction(
  snapshot: unknown,
  accountBalance: number,
  activeDrawdown: number = 0.0
): Promise<ActionResult<HybridDecisionResult>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validatedSnapshot = marketSnapshotSchema.parse(snapshot) as MarketSnapshot

    const rulesRepo = new IctRulesRepository(supabase)
    const rules = await rulesRepo.getByUser(user.id)

    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    if (!settings) {
      return { success: false, error: { type: 'database', message: 'User settings configuration not found.' } }
    }

    const economicRepo = new EconomicEventsRepository(supabase)
    const events = await economicRepo.getAll()

    // Fetch the active ML model (null if none exists yet or rules_only mode)
    const mlModelRepo = new MlModelRegistryRepository(supabase)
    const activeModel = settings.ml_mode !== 'rules_only'
      ? await mlModelRepo.getActiveModel(user.id)
      : null

    const decision = AiDecisionEngine.evaluate(
      validatedSnapshot,
      rules,
      settings,
      events,
      accountBalance,
      activeDrawdown,
      activeModel
    )

    return { success: true, data: decision }
  } catch (err) {
    return handleActionError<HybridDecisionResult>(err)
  }
}

/**
 * Saves the AI decision to the history log, persists the ML prediction,
 * and generates a Signal if the decision is ENTRY.
 */
export async function saveDecisionAndGenerateSignalAction(
  snapshot: unknown,
  decisionResult: HybridDecisionResult
): Promise<ActionResult<{ decision: AiDecision; signalGenerated: boolean; mlPredictionId: string | null }>> {
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
      model_version: decisionResult.mlModelVersion,
    })

    // 2. Persist ML prediction (for continuous learning feedback loop)
    let mlPredictionId: string | null = null
    if (decisionResult.mlInference) {
      const rulesRepo = new IctRulesRepository(supabase)
      const rules = await rulesRepo.getByUser(user.id)
      const { IctRulesEngine } = await import('@/lib/services/IctRulesEngine')
      const settingsRepo = new SettingsRepository(supabase)
      const settings = await settingsRepo.getById(user.id)
      const threshold = settings?.signal_threshold ?? 7.0

      const rulesResult = IctRulesEngine.evaluate(validatedSnapshot, rules, threshold)
      const featureVector = MlFeatureExtractor.extract(validatedSnapshot, rulesResult)

      const mlPredictionRepo = new MlPredictionRepository(supabase)
      const mlPrediction = await mlPredictionRepo.create({
        user_id: user.id,
        ai_decision_id: savedDecision.id,
        model_version: decisionResult.mlInference.appliedModelVersion,
        pair: validatedSnapshot.pair,
        timeframe: validatedSnapshot.timeframe,
        session: validatedSnapshot.session,
        ml_score: decisionResult.mlInference.mlScore,
        ml_confidence: decisionResult.mlInference.mlConfidence,
        ml_bias: decisionResult.mlInference.mlBias,
        ml_recommendation: decisionResult.mlInference.mlRecommendation,
        feature_vector: MlFeatureExtractor.serialize(featureVector),
      })
      mlPredictionId = mlPrediction.id
    }

    let signalGenerated = false

    // 3. Generate a Signal if execution decision is ENTRY
    if (decisionResult.decision === 'ENTRY' && decisionResult.positionCalculation) {
      const signalRepo = new SignalRepository(supabase)
      await signalRepo.create({
        user_id: user.id,
        pair: validatedSnapshot.pair,
        direction: decisionResult.marketBias === 'bullish' ? 'buy' : 'sell',
        score: decisionResult.finalScore,
        confidence: decisionResult.confidence,
        entry: decisionResult.positionCalculation.entryPrice,
        stop_loss: decisionResult.positionCalculation.stopLossPrice,
        tp1: decisionResult.positionCalculation.tp1,
        tp2: decisionResult.positionCalculation.tp2,
        status: 'active',
      })
      signalGenerated = true
    }

    revalidatePath('/dashboard/decision-engine')
    revalidatePath('/dashboard/ml-engine')
    revalidatePath('/dashboard/signals')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { decision: savedDecision, signalGenerated, mlPredictionId },
    }
  } catch (err) {
    return handleActionError<{ decision: AiDecision; signalGenerated: boolean; mlPredictionId: string | null }>(err)
  }
}
