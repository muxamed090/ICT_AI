export interface RuleInput {
    pair: string
    direction: 'buy' | 'sell'
    price: number
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
    score: number
    confidence: number
    session: string
    killzone?: string
    timeframe?: string
    hasNewsRisk: boolean
    newsWarning: string | null
    minutesToNews?: number
    htfBias?: 'bullish' | 'bearish' | 'neutral'
    hasBOS?: boolean
    hasCHoCH?: boolean
    hasFVG?: boolean
    hasOrderBlock?: boolean
    hasLiquiditySweep?: boolean
    spreadPips?: number
}

export interface RuleResult {
    ruleName: string
    passed: boolean
    score: number
    reason: string
    warning?: string
}

export interface RulesEngineOutput {
    passed: boolean
    totalScore: number
    maxScore: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    results: RuleResult[]
    passedRules: number
    failedRules: number
    recommendation: 'EXECUTE' | 'REVIEW' | 'SKIP'
    summary: string
}