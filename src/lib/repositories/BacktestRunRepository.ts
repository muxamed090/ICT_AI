import { SupabaseClient } from '@supabase/supabase-js'
import { Database, BacktestRun } from '@/types/database'

export class BacktestRunRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: Database['public']['Tables']['backtest_runs']['Insert']): Promise<BacktestRun> {
    const { data: created, error } = await this.supabase
      .from('backtest_runs')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async getByUser(userId: string, limit = 50): Promise<BacktestRun[]> {
    const { data, error } = await this.supabase
      .from('backtest_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getById(id: string): Promise<BacktestRun | null> {
    const { data, error } = await this.supabase
      .from('backtest_runs')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Lightweight query returning run summaries without loading heavy JSONB report fields.
   */
  async getSummaries(userId: string): Promise<Omit<BacktestRun, 'report'>[]> {
    const { data, error } = await this.supabase
      .from('backtest_runs')
      .select(
        'id, user_id, name, description, ml_mode, model_version, rules_engine_version, decision_engine_version, ml_engine_version, date_from, date_to, pair_filter, session_filter, total_trades, winning_trades, losing_trades, breakeven_trades, win_rate, loss_rate, profit_factor, expectancy, avg_rr, net_pnl, gross_profit, gross_loss, max_drawdown, max_drawdown_pct, sharpe_ratio, status, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as Omit<BacktestRun, 'report'>[]
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('backtest_runs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
