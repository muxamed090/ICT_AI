import { SupabaseClient } from '@supabase/supabase-js'
import { Database, IctRule } from '@/types/database'

export const DEFAULT_RULES: Omit<IctRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    rule_key: 'mss_choch',
    name: 'Market Structure Shift (MSS/CHoCH)',
    description: 'Break of structure or change of character on the trade execution timeframe.',
    category: 'structure',
    weight: 2.00,
    enabled: true,
    conditions: { min_displacement_pips: 2.0 },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'fvg_retest',
    name: 'Fair Value Gap (FVG) Retest',
    description: 'Price retesting a valid FVG (BISI or SIBI) within the key zone.',
    category: 'entry',
    weight: 1.50,
    enabled: true,
    conditions: { min_fvg_pips: 1.0, require_displacement: true },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'liquidity_sweep',
    name: 'Liquidity Sweep',
    description: 'Sweep of key daily, session, or swing high/low liquidity pools.',
    category: 'liquidity',
    weight: 2.00,
    enabled: true,
    conditions: { sweep_depth_pips: 0.5 },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'killzone_timing',
    name: 'Killzone Timing',
    description: 'Trade execution aligns strictly with Asia, London, or NY Killzones.',
    category: 'timing',
    weight: 1.00,
    enabled: true,
    conditions: { validate_session: true },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'ote_retracement',
    name: 'Optimal Trade Entry (OTE)',
    description: 'Retracement of price into the 62.0% - 79.0% Fibonacci levels.',
    category: 'entry',
    weight: 1.50,
    enabled: true,
    conditions: { fib_levels: [0.62, 0.705, 0.79] },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'htf_bias',
    name: 'HTF Trend Bias Alignment',
    description: 'Direction matches the Higher Timeframe market structure trend.',
    category: 'trend',
    weight: 2.00,
    enabled: true,
    conditions: { htf_timeframe: '4h' },
    version: '1.0.0',
    is_default: true
  },
  {
    rule_key: 'risk_constraint',
    name: 'Risk & Spread Constraint',
    description: 'Risk to reward evaluation and spreads check.',
    category: 'risk',
    weight: 1.00,
    enabled: true,
    conditions: { max_spread_pips: 2.5, min_rr_ratio: 2.0 },
    version: '1.0.0',
    is_default: true
  }
]

export class IctRulesRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByUser(userId: string): Promise<IctRule[]> {
    const { data, error } = await this.supabase
      .from('ict_rules')
      .select('*')
      .eq('user_id', userId)
      .order('rule_key', { ascending: true })

    if (error) throw error
    return data || []
  }

  async updateRule(id: string, updates: Database['public']['Tables']['ict_rules']['Update']): Promise<IctRule> {
    const { data, error } = await this.supabase
      .from('ict_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async resetToDefaults(userId: string): Promise<IctRule[]> {
    // 1. Delete all existing user rules
    const { error: deleteError } = await this.supabase
      .from('ict_rules')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    // 2. Insert default rules
    const rulesToInsert = DEFAULT_RULES.map((rule) => ({
      ...rule,
      user_id: userId
    }))

    const { data, error: insertError } = await this.supabase
      .from('ict_rules')
      .insert(rulesToInsert)
      .select()

    if (insertError) throw insertError
    return data || []
  }
}
