"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { WatchlistRepository } from '@/lib/repositories/WatchlistRepository'
import { watchlistSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { Watchlist } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function addWatchlistItem(data: unknown): Promise<ActionResult<Watchlist>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = watchlistSchema.parse(data)
    const watchlistRepo = new WatchlistRepository(supabase)
    const created = await watchlistRepo.create({
      user_id: user.id,
      pair: validated.pair,
      favorite: validated.favorite ?? false,
      enabled: validated.enabled ?? true,
      priority: validated.priority ?? 0,
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<Watchlist>(err)
  }
}

export async function updateWatchlistItem(id: string, data: unknown): Promise<ActionResult<Watchlist>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = watchlistSchema.partial().parse(data)
    const watchlistRepo = new WatchlistRepository(supabase)
    const updated = await watchlistRepo.update(id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<Watchlist>(err)
  }
}

export async function removeWatchlistItem(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const watchlistRepo = new WatchlistRepository(supabase)
    await watchlistRepo.delete(id)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}
