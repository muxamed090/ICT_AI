import { DecisionInput, DecisionOutput, AggregatedScore, RiskPlan, EntryPlan, FinalAction, ExecutionMode } from '../types'

export function planExecution(
    input: DecisionInput,
    aggregated: AggregatedScore,
    risk: RiskPlan,
    entry: EntryPlan,
    action: FinalAction,
    executionMode: ExecutionMode,
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
): DecisionOutput {
    const reasons: string[] = []
    const warnings: string[] = []

    // Aggregate reasons
    reasons.push(...aggregated.breakdown)
    reasons.push('')
    reasons.push('ICT: ' + input.ictResult.recommendation + ' | ML: ' + input.mlResult.prediction.recommendation + ' | Rules: ' + input.rulesResult.recommendation)
    reasons.push('Entry Quality: ' + entry.entryQuality + ' — ' + entry.entryReason)

    // Warnings from engines
    if (input.rulesResult.failedRules > 5) {
        warnings.push(input.rulesResult.failedRules + ' rules failed — review before executing')
    }
    if (input.mlResult.prediction.expectedWinRate < 55) {
        warnings.push('ML Win Rate ' + input.mlResult.prediction.expectedWinRate + '% — below 55% threshold')
    }
    if (risk.riskRewardTP1 < 1.5) {
        warnings.push('R:R ' + risk.riskRewardTP1 + ' below 1.5 minimum')
    }

    const confidence = parseFloat(aggregated.combinedScore.toFixed(0))

    const summary =
        action + ' ' + input.pair +
        ' @ ' + entry.optimalEntry.toFixed(5) +
        ' | SL: ' + input.stop_loss.toFixed(5) +
        ' | TP1: ' + input.tp1.toFixed(5) +
        ' | Size: ' + risk.positionSizeLots + ' lots' +
        ' | Risk: $' + risk.riskAmount +
        ' | R:R ' + risk.riskRewardTP1 +
        ' | Score: ' + confidence +
        ' | Grade: ' + grade +
        ' | Mode: ' + executionMode

    return {
        pair: input.pair,
        direction: input.direction,
        action,
        executionMode,
        aggregated,
        risk,
        entry,
        stop_loss: input.stop_loss,
        tp1: input.tp1,
        tp2: input.tp2,
        confidence,
        grade,
        reasons,
        warnings,
        summary,
        timestamp: new Date().toISOString(),
    }
}