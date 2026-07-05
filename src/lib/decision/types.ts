import { EngineOutput } from '@/lib/engine/types'
import { MLOutput } from '@/lib/ml/types'
import { RulesEngineOutput } from '@/lib/rules/types'

export interface DecisionInput {
    pair: string
    direction: 'buy' | 'sell'
    price: number
    entry: number
    stop_loss: number
    tp1: number
    tp2: number
    ictResult: EngineOutput
    mlResult: MLOutput
    rulesResult: RulesEngineOutput
    accountBalance: number
    riskPercent: number
}

export interface AggregatedScore {
    ictScore: number
    mlScore: number
    rulesScore: number
    combinedScore: number
    breakdown: string[]
}

export interface RiskPlan {
    riskAmount: number
    positionSizeLots: number
    pipValue: number
    slPips: number
    tp1Pips: number
    tp2Pips: number
    rewardTP1: number
    rewardTP2: number
    riskRewardTP1: number
    riskRewardTP2: number
}

export interface EntryPlan {
    optimalEntry: number
    entryQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    entryReason: string
}

export type FinalAction = 'BUY' | 'SELL' | 'WAIT' | 'NO TRADE'
export type ExecutionMode = 'Manual' | 'Semi-Auto' | 'Auto'

export interface DecisionOutput {
    pair: string
    direction: 'buy' | 'sell'
    action: FinalAction
    executionMode: ExecutionMode
    aggregated: AggregatedScore
    risk: RiskPlan
    entry: EntryPlan
    stop_loss: number
    tp1: number
    tp2: number
    confidence: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    reasons: string[]
    warnings: string[]
    summary: string
    timestamp: string
}