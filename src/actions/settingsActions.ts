"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { userSettingsSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { UserSettings } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function updateSettings(data: unknown): Promise<ActionResult<UserSettings>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = userSettingsSchema.parse(data)
    const settingsRepo = new SettingsRepository(supabase)
    const updated = await settingsRepo.update(user.id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<UserSettings>(err)
  }
}
