import { RiskResult, RulesResult, MomentumResult, ConfidenceResult } from '../types'
import { clamp } from '../utils'

export function runConfidenceEngine(
    baseConfidence: number,
    rules: RulesResult,
    risk: RiskResult,
    momentum: MomentumResult
): ConfidenceResult {
    let confidence = baseConfidence + rules.confidenceAdjustment
    if (risk.riskRewardRatio >= 2) confidence += 5
    else if (risk.riskRewardRatio >= 1.5) confidence += 2
    else confidence -= 10
    if (momentum.momentum === 'Strong') confidence += 3
    else if (momentum.momentum === 'Weak') confidence -= 8
    confidence = clamp(confidence, 0, 99)
    let entryQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    if (confidence >= 85 && risk.riskRewardRatio >= 2) entryQuality = 'Excellent'
    else if (confidence >= 70 && risk.riskRewardRatio >= 1.5) entryQuality = 'Good'
    else if (confidence >= 50) entryQuality = 'Fair'
    else entryQuality = 'Poor'
    return { confidence, entryQuality }
}