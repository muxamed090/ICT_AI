import { MLInput, PatternStats, PerformanceStats } from '../types'
import { calculateAdjustedConfidence } from '../scoring/ConfidenceCalculator'

export function runConfidenceModel(
    input: MLInput,
    pattern: PatternStats | null,
    performance: PerformanceStats
): number {
    return calculateAdjustedConfidence(input, pattern, performance)
}