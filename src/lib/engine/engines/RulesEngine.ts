import { SignalInput, RulesResult } from '../types'

export function runRulesEngine(signal: SignalInput): RulesResult {
    const reasons: string[] = []
    const warnings: string[] = []
    let confidenceAdjustment = 0
    let passed = true
    if (signal.score >= 85) {
        reasons.push(`Score ${signal.score} ≥ 85 → Very strong setup`)
        confidenceAdjustment += 5
    } else if (signal.score >= 70) {
        reasons.push(`Score ${signal.score} ≥ 70 → Strong setup`)
        confidenceAdjustment += 2
    } else if (signal.score >= 55) {
        reasons.push(`Score ${signal.score} ≥ 55 → Moderate setup`)
        confidenceAdjustment -= 5
    } else {
        warnings.push(`Score ${signal.score} < 55 → Weak setup`)
        confidenceAdjustment -= 15
        passed = false
    }
    if (signal.confidence >= 70) {
        reasons.push(`Confidence ${signal.confidence}% ≥ 70 → Acceptable`)
    } else {
        warnings.push(`Confidence ${signal.confidence}% < 70 → Low conviction`)
        confidenceAdjustment -= 10
        passed = false
    }
    reasons.push('Liquidity sweep assumed at current price level')
    if (!signal.hasNewsRisk) {
        reasons.push('News: Clear — safe to evaluate entry')
        confidenceAdjustment += 3
    }
    return { passed, reasons, warnings, confidenceAdjustment }
}