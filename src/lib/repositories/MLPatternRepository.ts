import { SupabaseClient } from '@supabase/supabase-js'

export interface MLPattern {
    id?: string
    user_id: string
    pair: string
    direction: string
    session: string
    setup: string
    timeframe: string
    killzone?: string
    strategy_version?: string
    trades: number
    wins: number
    losses: number
    win_rate: number
    avg_rr: number
    avg_holding_hours: number
    pattern_score: number
    last_updated?: string
    created_at?: string
}

export class MLPatternRepository {
    constructor(private supabase: SupabaseClient) { }

    async getAll(userId: string): Promise<MLPattern[]> {
        const { data, error } = await this.supabase
            .from('ml_patterns')
            .select('*')
            .eq('user_id', userId)
            .order('win_rate', { ascending: false })
        if (error) { console.error('MLPatternRepository.getAll:', error); return [] }
        return data ?? []
    }

    async findPattern(
        userId: string,
        pair: string,
        direction: string,
        session: string,
        setup: string
    ): Promise<MLPattern | null> {
        const { data, error } = await this.supabase
            .from('ml_patterns')
            .select('*')
            .eq('user_id', userId)
            .eq('pair', pair)
            .eq('direction', direction)
            .eq('session', session)
            .eq('setup', setup)
            .maybeSingle()
        if (error) { console.error('MLPatternRepository.findPattern:', error); return null }
        return data
    }

    async upsertFromTrades(
        userId: string,
        pair: string,
        direction: string,
        session: string,
        setup: string,
        timeframe: string,
        trades: number,
        wins: number,
        avgRR: number,
        avgHoldingHours: number
    ): Promise<void> {
        const winRate = trades > 0 ? parseFloat(((wins / trades) * 100).toFixed(1)) : 0
        const patternScore = parseFloat((winRate * 0.6 + avgRR * 10 * 0.4).toFixed(1))

        const { error } = await this.supabase
            .from('ml_patterns')
            .upsert({
                user_id: userId,
                pair,
                direction,
                session,
                setup,
                timeframe,
                trades,
                wins,
                losses: trades - wins,
                win_rate: winRate,
                avg_rr: avgRR,
                avg_holding_hours: avgHoldingHours,
                pattern_score: patternScore,
                last_updated: new Date().toISOString(),
            }, {
                onConflict: 'user_id,pair,direction,session,setup,timeframe',
            })
        if (error) console.error('MLPatternRepository.upsertFromTrades:', error)
    }

    async getTopPatterns(userId: string, limit = 10): Promise<MLPattern[]> {
        const { data, error } = await this.supabase
            .from('ml_patterns')
            .select('*')
            .eq('user_id', userId)
            .gte('trades', 5)
            .order('win_rate', { ascending: false })
            .limit(limit)
        if (error) { console.error('MLPatternRepository.getTopPatterns:', error); return [] }
        return data ?? []
    }
}