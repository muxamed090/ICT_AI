import { SupabaseClient } from '@supabase/supabase-js'
import { JournalEntry, JournalStats, SessionStats, PairStats, AIReview, PerformanceData } from './types'
import { TradeLogger } from './core/TradeLogger'
import { calculateStats, calculateSessionStats, calculatePairStats } from './core/StatisticsEngine'
import { reviewTrade } from './core/AIReviewer'
import { trackPerformance } from './core/PerformanceTracker'

export class JournalEngine {
    private logger: TradeLogger

    constructor(private supabase: SupabaseClient) {
        this.logger = new TradeLogger(supabase)
    }

    async log(entry: JournalEntry): Promise<JournalEntry | null> {
        return this.logger.log(entry)
    }

    async update(id: string, updates: Partial<JournalEntry>): Promise<void> {
        return this.logger.update(id, updates)
    }

    async delete(id: string): Promise<void> {
        return this.logger.delete(id)
    }

    async getAll(userId: string): Promise<JournalEntry[]> {
        return this.logger.getAll(userId)
    }

    async getStats(userId: string): Promise<JournalStats> {
        const trades = await this.logger.getAll(userId)
        return calculateStats(trades)
    }

    async getSessionStats(userId: string): Promise<SessionStats[]> {
        const trades = await this.logger.getAll(userId)
        return calculateSessionStats(trades)
    }

    async getPairStats(userId: string): Promise<PairStats[]> {
        const trades = await this.logger.getAll(userId)
        return calculatePairStats(trades)
    }

    async reviewTrade(id: string): Promise<AIReview | null> {
        const entry = await this.logger.getById(id)
        if (!entry) return null
        return reviewTrade(entry)
    }

    async getPerformance(userId: string, startingBalance = 10000): Promise<PerformanceData> {
        const trades = await this.logger.getAll(userId)
        return trackPerformance(trades, startingBalance)
    }
}