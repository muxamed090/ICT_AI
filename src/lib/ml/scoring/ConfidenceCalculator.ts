import { MLInput, PatternStats, PerformanceStats } from '../types'
import { clamp } from '../utils'

export function calculateAdjustedConfidence(
    input: MLInput,
    pattern: PatternStats | null,
    performance: PerformanceStats
): number {
    let confidence = input.ictConfidence

    // Historical win rate adjustment
    if (performance.winRate >= 75) confidence += 8
    else if (performance.winRate >= 60) confidence += 4
    else if (performance.winRate < 45) confidence -= 10

    // Pattern adjustment
    if (pattern) {
        const diff = pattern.winRate - 50
        confidence += diff * 0.3
    }

    // Profit factor
    if (performance.profitFactor >= 2) confidence += 5
    else if (performance.profitFactor < 1) confidence -= 8

    return clamp(Math.round(confidence), 0, 99)
}