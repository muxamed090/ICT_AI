import { MLInput, PatternStats } from '../types'
import { clamp } from '../utils'

export function calculateMLScore(input: MLInput, pattern: PatternStats | null): number {
    let score = input.ictScore

    // Pattern boost
    if (pattern) {
        if (pattern.winRate >= 75) score += 10
        else if (pattern.winRate >= 60) score += 5
        else if (pattern.winRate < 45) score -= 10

        if (pattern.avgRR >= 2) score += 5
        else if (pattern.avgRR < 1.5) score -= 5

        if (pattern.totalTrades >= 20) score += 3
    }

    // RR boost
    if (input.riskRewardRatio >= 2.5) score += 5
    else if (input.riskRewardRatio < 1.5) score -= 8

    return clamp(score, 0, 99)
}