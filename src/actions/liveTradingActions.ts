'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { BrokerAccountRepository } from '@/lib/repositories/BrokerAccountRepository'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { TradeQueueEngine } from '@/lib/services/broker/TradeQueueEngine'
import { EmergencyCircuitBreaker } from '@/lib/services/broker/EmergencyCircuitBreaker'
import { AuditLogger } from '@/lib/services/broker/AuditLogger'
import { brokerAccountSchema, orderExecutionSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { handleActionError } from '@/lib/services/errorHandler'
import {
  BrokerAccount,
  BrokerOrder,
  BrokerPosition,
  BrokerLog,
  TradeQueueItem,
  DecisionPlatformMode,
  ExecutionPlatformMode,
  TradingEnvironment,
} from '@/types/database'

// ── Broker Account Actions ────────────────────────────────────────────────────

export async function getBrokerAccountsAction(): Promise<ActionResult<BrokerAccount[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new BrokerAccountRepository(supabase)
    const accounts = await repo.getAll(user.id)
    return { success: true, data: accounts }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function createBrokerAccountAction(
  input: unknown
): Promise<ActionResult<BrokerAccount>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const parsed = brokerAccountSchema.parse(input)
    const repo = new BrokerAccountRepository(supabase)
    const account = await repo.create(user.id, parsed)

    await AuditLogger.log(
      supabase,
      user.id,
      'connection',
      'info',
      `Broker account created: ${account.account_name} (${account.broker_type})`,
      { accountId: account.id }
    )

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: account }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function setActiveBrokerAccountAction(
  accountId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new BrokerAccountRepository(supabase)
    await repo.setActive(user.id, accountId)

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function deleteBrokerAccountAction(
  accountId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new BrokerAccountRepository(supabase)
    await repo.delete(accountId, user.id)

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

// ── Trading Settings Actions ───────────────────────────────────────────────────

export async function updateTradingModeAction(
  decisionMode: DecisionPlatformMode,
  executionMode: ExecutionPlatformMode,
  tradingEnvironment: TradingEnvironment
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new SettingsRepository(supabase)
    await repo.update(user.id, {
      decision_mode: decisionMode,
      execution_mode: executionMode,
      trading_environment: tradingEnvironment,
    })

    await AuditLogger.log(
      supabase,
      user.id,
      'system',
      'info',
      `Trading mode updated: decision=${decisionMode} execution=${executionMode} env=${tradingEnvironment}`,
      { decisionMode, executionMode, tradingEnvironment }
    )

    revalidatePath('/dashboard/live-trading')
    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function toggleGlobalPauseAction(
  paused: boolean
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new SettingsRepository(supabase)
    await repo.update(user.id, { global_paused: paused })

    await AuditLogger.log(
      supabase,
      user.id,
      'risk',
      paused ? 'warn' : 'info',
      `Global trading ${paused ? 'PAUSED' : 'RESUMED'} by user`,
      { paused }
    )

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function triggerEmergencyStopAction(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new SettingsRepository(supabase)
    await repo.update(user.id, { emergency_stop: true, global_paused: true })

    await AuditLogger.log(
      supabase,
      user.id,
      'risk',
      'circuit_breaker',
      'EMERGENCY STOP activated by user — all trading halted',
      {}
    )

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function clearEmergencyStopAction(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new SettingsRepository(supabase)
    await repo.update(user.id, { emergency_stop: false, global_paused: false })

    await AuditLogger.log(
      supabase,
      user.id,
      'risk',
      'info',
      'Emergency stop CLEARED by user — trading resumed',
      {}
    )

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

// ── Trade Queue Actions ────────────────────────────────────────────────────────

export async function enqueueTradeAction(
  input: unknown
): Promise<ActionResult<TradeQueueItem>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    if (!settings) return { success: false, error: { type: 'database', message: 'Settings not found' } }

    // Enforce execution mode gate
    if (settings.execution_mode === 'manual') {
      return { success: false, error: { type: 'validation', message: 'Manual mode: auto-queue disabled' } }
    }

    if (settings.global_paused || settings.emergency_stop) {
      return { success: false, error: { type: 'validation', message: 'Trading is currently paused or stopped' } }
    }

    const parsed = orderExecutionSchema.parse(input)
    const queued = await TradeQueueEngine.enqueue(supabase, {
      user_id: user.id,
      broker_account_id: parsed.broker_account_id,
      ai_decision_id: parsed.ai_decision_id ?? null,
      pair: parsed.pair,
      direction: parsed.direction,
      lot_size: parsed.lot_size,
      requested_price: parsed.requested_price,
      stop_loss: parsed.stop_loss,
      take_profit: parsed.take_profit,
    })

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: queued }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function getTradeQueueAction(): Promise<ActionResult<TradeQueueItem[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const queue = await TradeQueueEngine.getPendingQueue(supabase, user.id)
    return { success: true, data: queue }
  } catch (err) {
    return handleActionError(err)
  }
}

// ── Live Trading Data Actions ──────────────────────────────────────────────────

export async function getRecentOrdersAction(limit = 50): Promise<ActionResult<BrokerOrder[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new LiveTradingRepository(supabase)
    const orders = await repo.getRecentOrders(user.id, limit)
    return { success: true, data: orders }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function getOpenPositionsAction(): Promise<ActionResult<BrokerPosition[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new LiveTradingRepository(supabase)
    const positions = await repo.getOpenPositions(user.id)
    return { success: true, data: positions }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function getSystemLogsAction(limit = 100): Promise<ActionResult<BrokerLog[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    const repo = new LiveTradingRepository(supabase)
    const logs = await repo.getRecentLogs(user.id, limit)
    return { success: true, data: logs }
  } catch (err) {
    return handleActionError(err)
  }
}

// ── Circuit Breaker Actions ────────────────────────────────────────────────────

export async function resetCircuitBreakerAction(
  accountId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { type: 'auth', message: 'Unauthorized' } }

    await EmergencyCircuitBreaker.manualReset(supabase, user.id, accountId)

    revalidatePath('/dashboard/live-trading')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}
