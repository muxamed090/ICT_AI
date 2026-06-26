"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EconomicEventsRepository } from '@/lib/repositories/EconomicEventsRepository'
import { economicEventSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { EconomicEvent } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function createEconomicEvent(data: unknown): Promise<ActionResult<EconomicEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = economicEventSchema.parse(data)
    const repo = new EconomicEventsRepository(supabase)
    const created = await repo.create({
      event_name: validated.event_name,
      currency: validated.currency,
      impact: validated.impact,
      event_time: validated.event_time,
      forecast: validated.forecast ?? null,
      previous: validated.previous ?? null,
      actual: validated.actual ?? null,
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<EconomicEvent>(err)
  }
}

export async function updateEconomicEvent(id: string, data: unknown): Promise<ActionResult<EconomicEvent>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = economicEventSchema.partial().parse(data)
    const repo = new EconomicEventsRepository(supabase)
    const updated = await repo.update(id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<EconomicEvent>(err)
  }
}

export async function deleteEconomicEvent(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const repo = new EconomicEventsRepository(supabase)
    await repo.delete(id)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}
