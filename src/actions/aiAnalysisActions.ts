"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AiAnalysisRepository } from '@/lib/repositories/AiAnalysisRepository'
import { aiAnalysisSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { AiAnalysis } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function createAiAnalysis(data: unknown): Promise<ActionResult<AiAnalysis>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = aiAnalysisSchema.parse(data)
    const analysisRepo = new AiAnalysisRepository(supabase)
    const created = await analysisRepo.create({
      user_id: user.id,
      pair: validated.pair,
      timeframe: validated.timeframe,
      market_bias: validated.market_bias,
      confluence_score: validated.confluence_score,
      bos: validated.bos ?? false,
      choch: validated.choch ?? false,
      order_block_mitigated: validated.order_block_mitigated ?? false,
      order_block_price: validated.order_block_price ?? null,
      fvg_type: validated.fvg_type,
      fvg_price: validated.fvg_price ?? null,
      liquidity_sweep_high: validated.liquidity_sweep_high ?? false,
      liquidity_sweep_low: validated.liquidity_sweep_low ?? false,
      ote_zone_detected: validated.ote_zone_detected ?? false,
      killzone: validated.killzone,
      session: validated.session,
      confidence: validated.confidence,
      explanation: validated.explanation,
      model_version: validated.model_version,
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<AiAnalysis>(err)
  }
}
