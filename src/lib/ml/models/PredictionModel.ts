import { MLInput, MLPrediction, PatternStats, PerformanceStats } from '../types'

export function runPredictionModel(
    input: MLInput,
    pattern: PatternStats | null,
    performance: PerformanceStats,
    adjustedConfidence: number
): MLPrediction {
    const reasons: string[] = []

    const expectedWinRate = pattern ? pattern.winRate : performance.winRate || 50
    const expectedRR = pattern ? pattern.avgRR : performance.avgRR || 1.5
    const expectedHoldingHours = pattern ? pattern.avgHoldingHours : 4
    const patternScore = pattern ? pattern.patternScore : 50

    if (pattern) {
        reasons.push('Pattern: ' + pattern.totalTrades + ' similar trades found — Win Rate ' + pattern.winRate + '%')
    } else {
        reasons.push('No historical pattern found for this setup')
    }

    if (performance.totalTrades > 0) {
        reasons.push('Overall Win Rate: ' + performance.winRate + '% from ' + performance.totalTrades + ' trades')
    }

    if (performance.profitFactor >= 2) {
        reasons.push('Profit Factor ' + performance.profitFactor + ' → Strong edge')
    }

    let recommendation: 'TAKE' | 'SKIP' | 'WATCH'
    if (adjustedConfidence >= 75 && expectedWinRate >= 60) recommendation = 'TAKE'
    else if (adjustedConfidence >= 55) recommendation = 'WATCH'
    else recommendation = 'SKIP'

    return {
        expectedWinRate,
        expectedRR,
        confidence: adjustedConfidence,
        expectedHoldingHours,
        patternScore,
        recommendation,
        reasons,
    }
}