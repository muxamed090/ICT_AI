"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { TelegramService } from '@/lib/services/TelegramService'
import { telegramSendSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { NotificationLog, TelegramStatusResult, TelegramEventType } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

/**
 * Helper: Instantiate TelegramService with auth-scoped repositories.
 * Centralizes the auth check + repo/service wiring.
 */
async function buildTelegramService() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, service: null }
  }

  const telegramRepo = new TelegramRepository(supabase)
  const settingsRepo = new SettingsRepository(supabase)
  const service = new TelegramService(telegramRepo, settingsRepo)

  return { user, service }
}

/**
 * Send a Telegram notification with an event type and optional payload.
 */
export async function sendTelegramNotification(data: unknown): Promise<ActionResult<NotificationLog>> {
  try {
    const { user, service } = await buildTelegramService()
    if (!user || !service) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = telegramSendSchema.parse(data)
    const messageText = service.buildMessage(
      validated.eventType as TelegramEventType,
      validated.payload
    )
    const result = await service.send(user.id, validated.eventType as TelegramEventType, messageText)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/system-monitor')
    return { success: result.success, data: result.logEntry }
  } catch (err) {
    return handleActionError<NotificationLog>(err)
  }
}

/**
 * Send a test message to verify Telegram integration.
 */
export async function sendTelegramTest(): Promise<ActionResult<NotificationLog>> {
  try {
    const { user, service } = await buildTelegramService()
    if (!user || !service) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const result = await service.sendTest(user.id)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/system-monitor')
    return { success: result.success, data: result.logEntry }
  } catch (err) {
    return handleActionError<NotificationLog>(err)
  }
}

/**
 * Get the current Telegram integration status.
 */
export async function getTelegramStatus(): Promise<ActionResult<TelegramStatusResult>> {
  try {
    const { user, service } = await buildTelegramService()
    if (!user || !service) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const status = await service.getStatus(user.id)
    return { success: true, data: status }
  } catch (err) {
    return handleActionError<TelegramStatusResult>(err)
  }
}

/**
 * Process all pending retry queue items for the authenticated user.
 */
export async function processNotificationQueue(): Promise<ActionResult<{ processed: number; succeeded: number; failed: number }>> {
  try {
    const { user, service } = await buildTelegramService()
    if (!user || !service) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const result = await service.processQueue(user.id)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/system-monitor')
    return { success: true, data: result }
  } catch (err) {
    return handleActionError<{ processed: number; succeeded: number; failed: number }>(err)
  }
}

/**
 * Get recent notification logs for the authenticated user.
 */
export async function getTelegramLogs(limit = 50): Promise<ActionResult<NotificationLog[]>> {
  try {
    const { user, service } = await buildTelegramService()
    if (!user || !service) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const logs = await service.getRecentLogs(user.id, limit)
    return { success: true, data: logs }
  } catch (err) {
    return handleActionError<NotificationLog[]>(err)
  }
}

/**
 * Wrapper/alias to satisfy User Request: testTelegramAction.
 */
export async function testTelegramAction(): Promise<ActionResult<NotificationLog>> {
  return sendTelegramTest()
}

