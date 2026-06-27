import { SupabaseClient } from '@supabase/supabase-js'
import { BrokerOrder, BrokerPosition, BrokerLog } from '@/types/database'

export class LiveTradingRepository {
  constructor(private supabase: SupabaseClient) {}

  // ── Broker Orders ──────────────────────────────────────────

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
}
