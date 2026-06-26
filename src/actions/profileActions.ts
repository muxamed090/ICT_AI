"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ProfileRepository } from '@/lib/repositories/ProfileRepository'
import { profileSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { Profile } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function updateProfile(data: unknown): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = profileSchema.parse(data)
    const profileRepo = new ProfileRepository(supabase)
    const updated = await profileRepo.update(user.id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<Profile>(err)
  }
}
