export interface SignalInput {
    pair: string
    direction: 'buy' | 'sell'
    price: number
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
    score: number
    confidence: number
    hasNewsRisk: boolean
    newsWarning: string | null
}

export interface TrendResult {
    trend: 'Uptrend' | 'Downtrend' | 'Sideways'
    marketBias: 'Bullish' | 'Bearish' | 'Neutral'
    reasons: string[]
}

export interface MomentumResult {
    momentum: 'Strong' | 'Moderate' | 'Weak'
    reasons: string[]
}

export interface RiskResult {
    risk: 'Low' | 'Medium' | 'High'
    riskRewardRatio: number
    warnings: string[]
    blocked: boolean
    blockReason?: string
}

export interface RulesResult {
    passed: boolean
    reasons: string[]
    warnings: string[]
    confidenceAdjustment: number
}

export interface ConfidenceResult {
    confidence: number
    entryQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

export type Recommendation =
    | 'STRONG BUY'
    | 'BUY'
    | 'STRONG SELL'
    | 'SELL'
    | 'WAIT'
    | 'NO TRADE'

export interface EngineOutput {
    pair: string
    direction: 'buy' | 'sell'
    recommendation: Recommendation
    confidence: number
    risk: 'Low' | 'Medium' | 'High'
    marketBias: 'Bullish' | 'Bearish' | 'Neutral'
    trend: 'Uptrend' | 'Downtrend' | 'Sideways'
    momentum: 'Strong' | 'Moderate' | 'Weak'
    entryQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    riskRewardRatio: number
    reasons: string[]
    warnings: string[]
    tradeSummary: string
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
}