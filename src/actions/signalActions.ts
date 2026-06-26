"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SignalRepository } from '@/lib/repositories/SignalRepository'
import { signalSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { Signal } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function createSignal(data: unknown): Promise<ActionResult<Signal>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = signalSchema.parse(data)
    const signalRepo = new SignalRepository(supabase)
    const created = await signalRepo.create({
      user_id: user.id,
      pair: validated.pair,
      direction: validated.direction,
      score: validated.score,
      confidence: validated.confidence,
      entry: validated.entry,
      stop_loss: validated.stop_loss,
      tp1: validated.tp1,
      tp2: validated.tp2,
      status: validated.status ?? 'pending',
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<Signal>(err)
  }
}
