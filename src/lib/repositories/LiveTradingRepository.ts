import { SupabaseClient } from '@supabase/supabase-js'
import { BrokerOrder, BrokerPosition, BrokerLog, TradeQueueItem } from '@/types/database'

type EnqueueInput = Omit<
  TradeQueueItem,
  'id' | 'status' | 'retry_count' | 'max_retries' | 'last_error' | 'created_at' | 'updated_at'
>

export class LiveTradingRepository {
  constructor(private supabase: SupabaseClient) {}

  // ── Trade Queue ─────────────────────────────────────────────

  async enqueueTrade(input: EnqueueInput, maxRetries = 3): Promise<TradeQueueItem> {
    const { data, error } = await this.supabase
      .from('trade_queue')
      .insert({
        ...input,
        status: 'queued',
        retry_count: 0,
        max_retries: maxRetries,
        last_error: null,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to enqueue trade: ${error?.message}`)
    }

    return data as TradeQueueItem
  }

  async getPendingQueue(userId: string): Promise<TradeQueueItem[]> {
    const { data, error } = await this.supabase
      .from('trade_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'validating'])
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch queue: ${error.message}`)

    return (data || []) as TradeQueueItem[]
  }

  async advanceQueueStatus(
    itemId: string,
    status: TradeQueueItem['status'],
    lastError: string | null = null
  ): Promise<void> {
    const { error } = await this.supabase
      .from('trade_queue')
      .update({ status, last_error: lastError, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) throw new Error(`Failed to advance queue status: ${error.message}`)
  }

  async incrementQueueRetry(itemId: string, reason: string, maxRetries = 3): Promise<void> {
    const { error } = await this.supabase.rpc('increment_queue_retry', {
      item_id: itemId,
      error_reason: reason,
    })

    if (error) {
      const { data: item } = await this.supabase
        .from('trade_queue')
        .select('retry_count')
        .eq('id', itemId)
        .single()

      const newRetryCount = ((item as { retry_count: number } | null)?.retry_count ?? 0) + 1
      const nextStatus = newRetryCount >= maxRetries ? 'failed' : 'queued'

      await this.supabase
        .from('trade_queue')
        .update({
          retry_count: newRetryCount,
          status: nextStatus,
          last_error: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
    }
  }

  // ── Broker Orders ──────────────────────────────────────────

  async createOrder(order: Omit<BrokerOrder, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.supabase.from('broker_orders').insert(order)
    if (error) throw error
  }

  async getRecentOrders(userId: string, limit = 50): Promise<BrokerOrder[]> {
    const { data, error } = await this.supabase
      .from('broker_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as BrokerOrder[]
  }

  async getOrdersByEnvironment(
    userId: string,
    environment: 'paper_trading' | 'demo_broker' | 'live_broker',
    limit = 50
  ): Promise<BrokerOrder[]> {
    const { data, error } = await this.supabase
      .from('broker_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('trading_environment', environment)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as BrokerOrder[]
  }

  async getTodayOrderCount(userId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count, error } = await this.supabase
      .from('broker_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())

    if (error) throw error
    return count ?? 0
  }

  // ── Broker Positions ───────────────────────────────────────

  async createPosition(position: Omit<BrokerPosition, 'id'>): Promise<void> {
    const { error } = await this.supabase.from('broker_positions').insert(position)
    if (error) throw error
  }

  async getOpenPositions(userId: string): Promise<BrokerPosition[]> {
    const { data, error } = await this.supabase
      .from('broker_positions')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return (data || []) as BrokerPosition[]
  }

  async closePosition(ticket: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('broker_positions')
      .delete()
      .eq('broker_ticket', ticket)
      .eq('user_id', userId)

    if (error) throw error
  }

  async updatePositionPnl(ticket: string, currentPrice: number, unrealizedPnl: number): Promise<void> {
    const { error } = await this.supabase
      .from('broker_positions')
      .update({
        current_price: currentPrice,
        unrealized_pnl: unrealizedPnl,
        updated_at: new Date().toISOString(),
      })
      .eq('broker_ticket', ticket)

    if (error) throw error
  }

  // ── Broker Logs ────────────────────────────────────────────

  async createLog(log: Omit<BrokerLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.supabase.from('broker_logs').insert(log)
    if (error) throw error
  }

  async getRecentLogs(userId: string, limit = 100): Promise<BrokerLog[]> {
    const { data, error } = await this.supabase
      .from('broker_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as BrokerLog[]
  }

  async getLogsByCategory(
    userId: string,
    category: BrokerLog['category'],
    limit = 50
  ): Promise<BrokerLog[]> {
    const { data, error } = await this.supabase
      .from('broker_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as BrokerLog[]
  }

  async getLogsForAccountCategory(
    accountId: string,
    category: string,
    limit = 20
  ): Promise<BrokerLog[]> {
    const { data, error } = await this.supabase
      .from('broker_logs')
      .select('*')
      .eq('broker_account_id', accountId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as unknown as BrokerLog[]
  }
}
