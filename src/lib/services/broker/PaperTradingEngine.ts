import { SupabaseClient } from '@supabase/supabase-js'
import {
  AccountSummary,
  ExecutionReceipt,
  BrokerPosition,
  TradeQueueItem,
} from '@/types/database'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'

export class PaperTradingEngine {
  /**
   * Mock account summary for Paper Trading.
   */
  static getAccountSummary(): AccountSummary {
    return {
      balance: 100000.0,
      equity: 100000.0,
      marginUsed: 0.0,
      freeMargin: 100000.0,
    }
  }

  /**
   * Matches a paper trade order locally, simulating spread slippage, and writes it to positions.
   */
  static async match(
    supabase: SupabaseClient,
    userId: string,
    order: TradeQueueItem | {
      pair: string
      direction: 'buy' | 'sell'
      lot_size: number
      requested_price: number
      stop_loss: number
      take_profit: number
    }
  ): Promise<ExecutionReceipt> {
    const startTime = Date.now()
    const ticket = `PAPER-${Math.floor(100000 + Math.random() * 900000)}`

    // Simulate mild slippage (0.1 - 0.5 pips)
    const slippage = (Math.random() * 0.4 + 0.1) / 100
    const sign = order.direction === 'buy' ? 1 : -1
    const executedPrice = Number((order.requested_price + slippage * sign).toFixed(5))

    const position: Omit<BrokerPosition, 'id'> = {
      user_id: userId,
      broker_account_id: null,
      broker_ticket: ticket,
      pair: order.pair,
      direction: order.direction,
      lot_size: order.lot_size,
      open_price: executedPrice,
      current_price: executedPrice,
      stop_loss: order.stop_loss,
      take_profit: order.take_profit,
      unrealized_pnl: 0.0,
      swap: 0.0,
      commission: -1.0 * order.lot_size, // Simulate standard commission
      trading_environment: 'paper_trading',
    }

    try {
      const repo = new LiveTradingRepository(supabase)
      await repo.createPosition(position)
    } catch (error) {
      return {
        success: false,
        ticket: null,
        executedPrice: null,
        rejectionReason: `Failed to open paper position: ${(error as Error).message}`,
        latencyMs: Date.now() - startTime,
      }
    }

    return {
      success: true,
      ticket,
      executedPrice,
      rejectionReason: null,
      latencyMs: Date.now() - startTime,
    }
  }
}
