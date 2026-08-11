export type TradeDirection = 'buy' | 'sell'
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'pending'

export interface JournalEntry {
    id?: string
    user_id: string
    pair: string
    direction: TradeDirection
    timeframe: string
    session: string
    killzone?: string
    setup_type: string
    entry: number
    stop_loss: number
    take_profit: number
    risk_reward: number
    result: TradeResult
    pnl: number
    notes?: string
    screenshot_url?: string
    ai_confidence?: number
    prediction_id?: string
    created_at?: string
}

export interface JournalStats {
    totalTrades: number
    wins: number
    losses: number
    breakeven: number
    winRate: number
    avgRR: number
    totalPnl: number
    profitFactor: number
    avgWin: number
    avgLoss: number
    bestTrade: JournalEntry | null
    worstTrade: JournalEntry | null
    maxConsecutiveWins: number
    maxConsecutiveLosses: number
}

export interface SessionStats {
    session: string
    trades: number
    wins: number
    winRate: number
    totalPnl: number
}

export interface PairStats {
    pair: string
    trades: number
    wins: number
    winRate: number
    avgRR: number
    totalPnl: number
}

export interface AIReview {
    pair: string
    direction: TradeDirection
    setup: string
    entryQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    riskManagement: 'Good' | 'Acceptable' | 'Poor'
    confluenceScore: number
    strengths: string[]
    weaknesses: string[]
    lesson: string
    rating: number
}

export interface PerformanceData {
    equityCurve: { date: string; equity: number; drawdown: number }[]
    maxDrawdown: number
    sharpeRatio: number
    expectancy: number
    monthlyPnl: Record<string, number>
}