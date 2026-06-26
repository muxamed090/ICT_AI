"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TradeJournalRepository } from '@/lib/repositories/TradeJournalRepository'
import { tradeJournalSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { TradeJournal } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function createJournalEntry(data: unknown): Promise<ActionResult<TradeJournal>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = tradeJournalSchema.parse(data)
    const journalRepo = new TradeJournalRepository(supabase)
    const created = await journalRepo.create({
      user_id: user.id,
      pair: validated.pair,
      direction: validated.direction,
      timeframe: validated.timeframe,
      session: validated.session,
      killzone: validated.killzone,
      setup_type: validated.setup_type,
      entry: validated.entry,
      stop_loss: validated.stop_loss,
      take_profit: validated.take_profit,
      risk_reward: validated.risk_reward,
      result: validated.result ?? 'pending',
      pnl: validated.pnl ?? 0.00,
      notes: validated.notes ?? null,
      screenshot_url: validated.screenshot_url ?? null,
      ai_confidence: validated.ai_confidence ?? null,
      prediction_id: validated.prediction_id ?? null,
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<TradeJournal>(err)
  }
}

export async function updateJournalEntry(id: string, data: unknown): Promise<ActionResult<TradeJournal>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = tradeJournalSchema.partial().parse(data)
    const journalRepo = new TradeJournalRepository(supabase)
    const updated = await journalRepo.update(id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<TradeJournal>(err)
  }
}

export async function deleteJournalEntry(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const journalRepo = new TradeJournalRepository(supabase)
    await journalRepo.delete(id)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}
