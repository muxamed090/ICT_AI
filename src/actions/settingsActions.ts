"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { userSettingsSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { UserSettings } from '@/types/database'
import { handleActionError } from '@/lib/services/errorHandler'

export async function getSettingsAction(): Promise<ActionResult<UserSettings>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const settingsRepo = new SettingsRepository(supabase)
    let settings = await settingsRepo.getById(user.id)

    if (!settings) {
      settings = await settingsRepo.create({
        id: user.id,
        theme: 'dark',
        timezone: 'UTC',
        language: 'en',
        notification_enabled: true,
        telegram_enabled: false,
        telegram_chat_id: null,
        risk_percent: 1.0,
        ai_learning_enabled: true,
        ml_mode: 'rules_only',
        signal_threshold: 7.0,
        max_spread_allowed: 3.0,
        daily_drawdown_limit: 5.0,
        news_buffer_minutes: 30,
        risk_profile: 'balanced',
        ml_confidence_weight: 0.30,
        ml_min_training_samples: 10,
        ml_auto_retrain: true,
        decision_mode: 'hybrid',
        execution_mode: 'confirmation_required',
        trading_environment: 'paper_trading',
        max_trades_per_day: 5,
        enabled_sessions: ['london', 'new_york_am', 'new_york_pm'],
        global_paused: false,
        emergency_stop: false,
        max_slippage_pips: 1.5,
      })
    }

    return { success: true, data: settings }
  } catch (err) {
    return handleActionError<UserSettings>(err)
  }
}

export async function updateSettings(data: unknown): Promise<ActionResult<UserSettings>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const validated = userSettingsSchema.partial().parse(data)
    const settingsRepo = new SettingsRepository(supabase)
    const updated = await settingsRepo.update(user.id, validated)

    revalidatePath('/dashboard')
    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<UserSettings>(err)
  }
}
