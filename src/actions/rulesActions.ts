"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { AiAnalysisRepository } from '@/lib/repositories/AiAnalysisRepository'
import { SignalRepository } from '@/lib/repositories/SignalRepository'
import { IctRulesEngine } from '@/lib/services/IctRulesEngine'
import { ictRuleSchema, marketSnapshotSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { IctRule, EngineResult, MarketSnapshot, AiAnalysis, Signal } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function getIctRules(): Promise<ActionResult<IctRule[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const rulesRepo = new IctRulesRepository(supabase)
    let rules = await rulesRepo.getByUser(user.id)

    // Self-healing: if user has no rules yet, seed defaults
    if (rules.length === 0) {
      rules = await rulesRepo.resetToDefaults(user.id)
    }

    return { success: true, data: rules }
  } catch (err) {
    return handleActionError<IctRule[]>(err)
  }
}

export async function updateRuleAction(id: string, data: unknown): Promise<ActionResult<IctRule>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = ictRuleSchema.partial().parse(data)
    const rulesRepo = new IctRulesRepository(supabase)
    const updated = await rulesRepo.updateRule(id, validated)

    revalidatePath('/dashboard/rules')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<IctRule>(err)
  }
}

export async function resetRulesToDefaultsAction(): Promise<ActionResult<IctRule[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const rulesRepo = new IctRulesRepository(supabase)
    const rules = await rulesRepo.resetToDefaults(user.id)

    revalidatePath('/dashboard/rules')
    return { success: true, data: rules }
  } catch (err) {
    return handleActionError<IctRule[]>(err)
  }
}

export async function simulateConfluenceAction(snapshot: unknown): Promise<ActionResult<EngineResult>> {
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

    // Get User signal threshold settings
    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    const threshold = settings?.signal_threshold ?? 7.00

    const result = IctRulesEngine.evaluate(validatedSnapshot, rules, threshold)
    return { success: true, data: result }
  } catch (err) {
    return handleActionError<EngineResult>(err)
  }
}

export async function saveSimulatedAnalysisAction(snapshot: unknown): Promise<ActionResult<AiAnalysis>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validatedSnapshot = marketSnapshotSchema.parse(snapshot) as MarketSnapshot

    // Fetch user rules configurations
    const rulesRepo = new IctRulesRepository(supabase)
    const rules = await rulesRepo.getByUser(user.id)

    // Fetch threshold settings
    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    const threshold = settings?.signal_threshold ?? 7.00

    // Evaluate
    const engineResult = IctRulesEngine.evaluate(validatedSnapshot, rules, threshold)

    // Write to AI Analysis log
    const aiRepo = new AiAnalysisRepository(supabase)
    const created = await aiRepo.create({
      user_id: user.id,
      pair: validatedSnapshot.pair,
      timeframe: validatedSnapshot.timeframe,
      market_bias: engineResult.marketBias,
      confluence_score: engineResult.confluenceScore,
      bos: validatedSnapshot.bos,
      choch: validatedSnapshot.choch,
      order_block_mitigated: false,
      order_block_price: null,
      fvg_type: validatedSnapshot.fvg_type,
      fvg_price: null,
      liquidity_sweep_high: validatedSnapshot.liquidity_sweep === 'high',
      liquidity_sweep_low: validatedSnapshot.liquidity_sweep === 'low',
      ote_zone_detected: validatedSnapshot.ote,
      killzone: validatedSnapshot.killzone,
      session: validatedSnapshot.session,
      confidence: engineResult.confidence,
      explanation: engineResult.explanation,
      model_version: 'ICT Rules Engine v1.0.0'
    })

    revalidatePath('/dashboard/ai-analysis')
    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<AiAnalysis>(err)
  }
}

// Generate typical entry, stop loss, and targets based on pair for mock signals
function estimatePriceLevels(pair: string, bias: 'bullish' | 'bearish') {
  const defaults: Record<string, { entry: number; slPips: number; tp1Pips: number; tp2Pips: number; decimals: number }> = {
    EURUSD: { entry: 1.08500, slPips: 20, tp1Pips: 40, tp2Pips: 80, decimals: 5 },
    GBPUSD: { entry: 1.27000, slPips: 25, tp1Pips: 50, tp2Pips: 100, decimals: 5 },
    USDJPY: { entry: 155.000, slPips: 30, tp1Pips: 60, tp2Pips: 120, decimals: 3 },
    XAUUSD: { entry: 2350.00, slPips: 80, tp1Pips: 150, tp2Pips: 300, decimals: 2 },
    BTCUSD: { entry: 65000.00, slPips: 500, tp1Pips: 1000, tp2Pips: 2500, decimals: 2 }
  }

  const cleanPair = pair.replace('/', '').toUpperCase()
  const params = defaults[cleanPair] || { entry: 1.00000, slPips: 30, tp1Pips: 60, tp2Pips: 120, decimals: 5 }

  const pipValue = Math.pow(10, -params.decimals) * (cleanPair.includes('JPY') ? 100 : 1) // JPY pips multiplier adjustment
  const mult = bias === 'bullish' ? 1 : -1

  const entry = params.entry
  const stop_loss = Number((entry - mult * params.slPips * pipValue).toFixed(params.decimals))
  const tp1 = Number((entry + mult * params.tp1Pips * pipValue).toFixed(params.decimals))
  const tp2 = Number((entry + mult * params.tp2Pips * pipValue).toFixed(params.decimals))

  return { entry, stop_loss, tp1, tp2 }
}

export async function generateSignalFromSimulationAction(analysisId: string): Promise<ActionResult<Signal>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    // Get the analysis
    const aiRepo = new AiAnalysisRepository(supabase)
    const analysis = await aiRepo.getById(analysisId)
    if (!analysis) {
      return { success: false, error: { type: 'database', message: 'AI Analysis record not found.' } }
    }

    // Double-check threshold
    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    const threshold = settings?.signal_threshold ?? 7.00

    if (Number(analysis.confluence_score) < threshold) {
      return { success: false, error: { type: 'validation', message: `Confluence score must be at least ${threshold} to generate trade signal.` } }
    }

    if (analysis.market_bias === 'neutral') {
      return { success: false, error: { type: 'validation', message: 'Cannot generate signal for neutral market bias.' } }
    }

    // Estimate price levels
    const direction = analysis.market_bias === 'bullish' ? 'buy' : 'sell'
    const levels = estimatePriceLevels(analysis.pair, analysis.market_bias)

    // Write to Signals
    const signalRepo = new SignalRepository(supabase)
    const signal = await signalRepo.create({
      user_id: user.id,
      pair: analysis.pair,
      direction,
      score: Number(analysis.confluence_score),
      confidence: Number(analysis.confidence),
      entry: levels.entry,
      stop_loss: levels.stop_loss,
      tp1: levels.tp1,
      tp2: levels.tp2,
      status: 'active'
    })

    revalidatePath('/dashboard/signals')
    revalidatePath('/dashboard')
    return { success: true, data: signal }
  } catch (err) {
    return handleActionError<Signal>(err)
  }
}
