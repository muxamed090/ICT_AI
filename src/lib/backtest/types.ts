export interface Candle {
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume?: number
}

export interface BacktestConfig {
    pair: string
    direction?: 'buy' | 'sell' | 'both'
    timeframe: string
    startDate: string
    endDate: string
    accountBalance: number
    riskPercent: number
    setup: string
}

export interface BacktestTrade {
    id: string
    pair: string
    direction: 'buy' | 'sell'
    entryPrice: number
    stopLoss: number
    tp1: number
    tp2: number
    entryTime: string
    exitTime?: string
    exitPrice?: number
    outcome: 'win' | 'loss' | 'breakeven' | 'pending'
    rrAchieved: number
    pnl: number
    ictScore: number
    mlScore: number
    rulesGrade: string
    decisionScore: number
    session: string
}

export interface EquityPoint {
    time: string
    equity: number
    drawdown: number
}

export interface BacktestReport {
    config: BacktestConfig
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    avgRR: number
    profitFactor: number
    maxDrawdown: number
    totalPnl: number
    finalEquity: number
    equityCurve: EquityPoint[]
    trades: BacktestTrade[]
    pairPerformance: Record<string, { wins: number; losses: number; winRate: number; avgRR: number }>
    sessionPerformance: Record<string, { wins: number; losses: number; winRate: number }>
    bestTrade: BacktestTrade | null
    worstTrade: BacktestTrade | null
    generatedAt: string
}