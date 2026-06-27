import { SupabaseClient } from '@supabase/supabase-js'
import { TradeQueueItem, TradingEnvironment, ExecutionReceipt } from '@/types/database'
import { BrokerAdapter } from './BrokerAdapter'
import { PaperTradingEngine } from './PaperTradingEngine'
import { SmartOrderRetry } from './SmartOrderRetry'
import { EmergencyCircuitBreaker } from './EmergencyCircuitBreaker'
import { AuditLogger } from './AuditLogger'
import { TradeQueueEngine } from './TradeQueueEngine'

interface ExecutionContext {
  supabase: SupabaseClient
  userId: string
  environment: TradingEnvironment
  adapter: BrokerAdapter | null
  globalPaused: boolean
  emergencyStop: boolean
  maxTradesPerDay: number
  maxSlippagePips: number
}

export class OrderExecutionEngine {
  /**
   * Main entry-point: processes a queued trade item through the full execution pipeline.
   * Decision → Queue → Validate → Broker → Confirm
   */
  static async processQueueItem(
    item: TradeQueueItem,
    ctx: ExecutionContext
  ): Promise<ExecutionReceipt> {
    const { supabase, userId, environment, adapter, globalPaused, emergencyStop } = ctx

    // ── Safety Gates ──────────────────────────────────────────
    if (globalPaused) {
      await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', 'Global trading paused')
      await AuditLogger.log(supabase, userId, 'risk', 'warn', 'Order rejected: global pause active', { itemId: item.id }, item.broker_account_id)
      return this.failedReceipt('Global trading paused')
    }

    if (emergencyStop) {
      await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', 'Emergency stop active')
      await AuditLogger.log(supabase, userId, 'risk', 'circuit_breaker', 'Order rejected: emergency stop', { itemId: item.id }, item.broker_account_id)
      return this.failedReceipt('Emergency stop active')
    }

    // ── Circuit Breaker Check ─────────────────────────────────
    const accountId = item.broker_account_id ?? 'paper'
    if (!EmergencyCircuitBreaker.isClosed(userId, accountId)) {
      await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', 'Circuit breaker open')
      await AuditLogger.log(supabase, userId, 'risk', 'circuit_breaker', 'Order rejected: circuit breaker open', { itemId: item.id }, item.broker_account_id)
      return this.failedReceipt('Circuit breaker open — too many consecutive failures')
    }

    // ── Daily Trade Limit Check ───────────────────────────────
    const { count: todayCount } = await supabase
      .from('broker_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

    if ((todayCount ?? 0) >= ctx.maxTradesPerDay) {
      await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', 'Daily trade limit reached')
      await AuditLogger.log(supabase, userId, 'risk', 'warn', 'Order rejected: daily limit', { todayCount, limit: ctx.maxTradesPerDay }, item.broker_account_id)
      return this.failedReceipt('Daily trade limit reached')
    }

    // ── Mark as Validating ────────────────────────────────────
    await TradeQueueEngine.advanceStatus(supabase, item.id, 'validating')

    let receipt: ExecutionReceipt

    // ── Route to Correct Environment ─────────────────────────
    if (environment === 'paper_trading') {
      receipt = await PaperTradingEngine.match(supabase, userId, item)
    } else {
      if (!adapter) {
        await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', 'No broker adapter configured')
        return this.failedReceipt('No broker adapter configured for live/demo execution')
      }

      await TradeQueueEngine.advanceStatus(supabase, item.id, 'sending')

      const retryResult = await SmartOrderRetry.execute(adapter, {
        pair: item.pair,
        direction: item.direction,
        lot_size: item.lot_size,
        requested_price: item.requested_price,
        stop_loss: item.stop_loss,
        take_profit: item.take_profit,
      })

      receipt = retryResult
    }

    // ── Record Broker Order ───────────────────────────────────
    await supabase.from('broker_orders').insert({
      user_id: userId,
      broker_account_id: item.broker_account_id,
      ai_decision_id: item.ai_decision_id,
      broker_ticket: receipt.ticket,
      pair: item.pair,
      direction: item.direction,
      lot_size: item.lot_size,
      requested_price: item.requested_price,
      executed_price: receipt.executedPrice,
      stop_loss: item.stop_loss,
      take_profit: item.take_profit,
      trading_environment: environment,
      status: receipt.success ? 'filled' : 'rejected',
      rejection_reason: receipt.rejectionReason,
      execution_latency_ms: receipt.latencyMs,
      executed_at: receipt.success ? new Date().toISOString() : null,
    })

    // ── Post-execution bookkeeping ────────────────────────────
    if (receipt.success) {
      await TradeQueueEngine.advanceStatus(supabase, item.id, 'executed')
      EmergencyCircuitBreaker.recordSuccess(userId, accountId)
      await AuditLogger.log(supabase, userId, 'execution', 'info', `Order executed: ${item.pair} ${item.direction} @ ${receipt.executedPrice}`, { receipt }, item.broker_account_id)
    } else {
      await EmergencyCircuitBreaker.recordFailure(supabase, userId, accountId, receipt.rejectionReason ?? 'Unknown')

      if (item.retry_count < item.max_retries) {
        await TradeQueueEngine.incrementRetry(supabase, item.id, receipt.rejectionReason ?? 'Unknown')
      } else {
        await TradeQueueEngine.advanceStatus(supabase, item.id, 'failed', receipt.rejectionReason)
      }

      await AuditLogger.log(supabase, userId, 'execution', 'error', `Order failed: ${receipt.rejectionReason}`, { itemId: item.id, receipt }, item.broker_account_id)
    }

    return receipt
  }

  private static failedReceipt(reason: string): ExecutionReceipt {
    return {
      success: false,
      ticket: null,
      executedPrice: null,
      rejectionReason: reason,
      latencyMs: 0,
    }
  }
}
