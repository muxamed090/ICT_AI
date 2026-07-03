import { SupabaseClient } from '@supabase/supabase-js'

export interface MLTrade {
    id?: string
    user_id: string
    pair: string
    direction: string
    session: string
    setup: string
    timeframe: string
    killzone?: string
    strategy_version?: string
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
    rr_achieved?: number
    outcome?: string
    confidence: number
    risk: string
    ict_score: number
    ml_score: number
    holding_hours?: number
    notes?: string
    created_at?: string
    closed_at?: string
}

export class MLTradeRepository {
    constructor(private supabase: SupabaseClient) { }

    async save(trade: MLTrade): Promise<MLTrade | null> {
        const { data, error } = await this.supabase
            .from('ml_trades')
            .insert(trade)
            .select()
            .single()
        if (error) { console.error('MLTradeRepository.save:', error); return null }
        return data
    }

    async getByUser(userId: string): Promise<MLTrade[]> {
        const { data, error } = await this.supabase
            .from('ml_trades')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) { console.error('MLTradeRepository.getByUser:', error); return [] }
        return data ?? []
    }

    async getByPair(userId: string, pair: string): Promise<MLTrade[]> {
        const { data, error } = await this.supabase
            .from('ml_trades')
            .select('*')
            .eq('user_id', userId)
            .eq('pair', pair)
            .order('created_at', { ascending: false })
        if (error) { console.error('MLTradeRepository.getByPair:', error); return [] }
        return data ?? []
    }

    async updateOutcome(
        id: string,
        outcome: 'win' | 'loss' | 'breakeven',
        rrAchieved: number,
        holdingHours: number
    ): Promise<void> {
        const { error } = await this.supabase
            .from('ml_trades')
            .update({
                outcome,
                rr_achieved: rrAchieved,
                holding_hours: holdingHours,
                closed_at: new Date().toISOString(),
            })
            .eq('id', id)
        if (error) console.error('MLTradeRepository.updateOutcome:', error)
    }

    async getPatternStats(
        userId: string,
        pair: string,
        direction: string,
        session: string
    ): Promise<{ winRate: number; avgRR: number; total: number }> {
        const trades = await this.getByUser(userId)
        const matched = trades.filter(
            (t) =>
                t.pair === pair &&
                t.direction === direction &&
                t.session === session &&
                t.outcome !== 'pending'
        )
        if (matched.length === 0) return { winRate: 0, avgRR: 0, total: 0 }

        const wins = matched.filter((t) => t.outcome === 'win').length
        const avgRR = matched.reduce((a, t) => a + (t.rr_achieved ?? 0), 0) / matched.length

        return {
            winRate: Math.round((wins / matched.length) * 100),
            avgRR: parseFloat(avgRR.toFixed(2)),
            total: matched.length,
        }
    }
}