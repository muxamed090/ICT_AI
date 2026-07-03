export interface TradeRecord {
    id: string
    pair: string
    direction: 'buy' | 'sell'
    session: 'london' | 'new_york' | 'asian' | 'overlap'
    setup: string
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
    outcome: 'win' | 'loss' | 'breakeven'
    rr_achieved: number
    holding_hours: number
    ict_score: number
    confidence: number
    created_at: string
}

export interface PatternStats {
    pair: string
    direction: 'buy' | 'sell'
    session: string
    setup: string
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    avgRR: number
    avgHoldingHours: number
    patternScore: number
}

export interface PerformanceStats {
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    avgRR: number
    bestPair: string
    worstPair: string
    bestSession: string
    maxDrawdown: number
    profitFactor: number
}

export interface MLPrediction {
    expectedWinRate: number
    expectedRR: number
    confidence: number
    expectedHoldingHours: number
    patternScore: number
    recommendation: 'TAKE' | 'SKIP' | 'WATCH'
    reasons: string[]
}

export interface MLInput {
    pair: string
    direction: 'buy' | 'sell'
    session: string
    setup: string
    ictScore: number
    ictConfidence: number
    riskRewardRatio: number
    historicalTrades: TradeRecord[]
}

export interface MLOutput {
    mlScore: number
    adjustedConfidence: number
    prediction: MLPrediction
    performance: PerformanceStats
    patternStats: PatternStats | null
}