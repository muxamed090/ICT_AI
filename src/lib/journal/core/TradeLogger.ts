import { SupabaseClient } from '@supabase/supabase-js'
import { JournalEntry } from '../types'

export class TradeLogger {
    constructor(private supabase: SupabaseClient) { }

    async log(entry: JournalEntry): Promise<JournalEntry | null> {
        const { data, error } = await this.supabase
            .from('trade_journal')
            .insert({
                user_id: entry.user_id,
                pair: entry.pair,
                direction: entry.direction,
                timeframe: entry.timeframe,
                session: entry.session,
                killzone: entry.killzone ?? null,
                setup_type: entry.setup_type,
                entry: entry.entry,
                stop_loss: entry.stop_loss,
                take_profit: entry.take_profit,
                risk_reward: entry.risk_reward,
                result: entry.result,
                pnl: entry.pnl,
                notes: entry.notes ?? null,
                screenshot_url: entry.screenshot_url ?? null,
                ai_confidence: entry.ai_confidence ?? null,
            })
            .select()
            .single()

        if (error) { console.error('TradeLogger.log:', error); return null }
        return data
    }

    async update(id: string, updates: Partial<JournalEntry>): Promise<void> {
        const { error } = await this.supabase
            .from('trade_journal')
            .update(updates)
            .eq('id', id)
        if (error) console.error('TradeLogger.update:', error)
    }

    async getAll(userId: string): Promise<JournalEntry[]> {
        const { data, error } = await this.supabase
            .from('trade_journal')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) { console.error('TradeLogger.getAll:', error); return [] }
        return data ?? []
    }

    async getById(id: string): Promise<JournalEntry | null> {
        const { data, error } = await this.supabase
            .from('trade_journal')
            .select('*')
            .eq('id', id)
            .single()
        if (error) { console.error('TradeLogger.getById:', error); return null }
        return data
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('trade_journal')
            .delete()
            .eq('id', id)
        if (error) console.error('TradeLogger.delete:', error)
    }
}