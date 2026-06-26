"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { NotificationRepository } from '@/lib/repositories/NotificationRepository'
import { notificationSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { Notification } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function createNotification(data: unknown): Promise<ActionResult<Notification>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = notificationSchema.parse(data)
    const notifRepo = new NotificationRepository(supabase)
    const created = await notifRepo.create({
      user_id: user.id,
      type: validated.type,
      title: validated.title,
      message: validated.message,
      read: validated.read ?? false,
    })

    revalidatePath('/dashboard')
    return { success: true, data: created }
  } catch (err) {
    return handleActionError<Notification>(err)
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult<Notification>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const notifRepo = new NotificationRepository(supabase)
    const updated = await notifRepo.update(id, { read: true })

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<Notification>(err)
  }
}

export async function deleteNotification(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const notifRepo = new NotificationRepository(supabase)
    await notifRepo.delete(id)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}
