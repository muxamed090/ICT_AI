import { SupabaseClient } from '@supabase/supabase-js'
import { Database, BacktestTrade } from '@/types/database'

export class BacktestTradeRepository {
  constructor(private supabase: SupabaseClient) {}

  async bulkCreate(trades: Database['public']['Tables']['backtest_trades']['Insert'][]): Promise<BacktestTrade[]> {
    if (trades.length === 0) return []

    const { data, error } = await this.supabase
      .from('backtest_trades')
      .insert(trades)
      .select()

    if (error) throw error
    return data || []
  }

  async getByRun(runId: string): Promise<BacktestTrade[]> {
    const { data, error } = await this.supabase
      .from('backtest_trades')
      .select('*')
      .eq('backtest_run_id', runId)
      .order('trade_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  async deleteByRun(runId: string): Promise<void> {
    const { error } = await this.supabase
      .from('backtest_trades')
      .delete()
      .eq('backtest_run_id', runId)

    if (error) throw error
  }
}
