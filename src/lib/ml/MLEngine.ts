import { MLInput, MLOutput } from './types'
import { findPattern } from './models/PatternModel'
import { calculatePerformance } from './models/PerformanceModel'
import { runConfidenceModel } from './models/ConfidenceModel'
import { runPredictionModel } from './models/PredictionModel'
import { calculateMLScore } from './scoring/ScoreCalculator'
import { getSeedTrades } from './learning/HistoricalLearning'

export function runMLEngine(input: MLInput): MLOutput {
    // 1. Get historical trades (seed + journal trades)
    const allTrades = [...getSeedTrades(), ...input.historicalTrades]

    // 2. Pattern matching
    const pattern = findPattern(allTrades, input.pair, input.direction, input.session)

    // 3. Overall performance
    const performance = calculatePerformance(allTrades)

    // 4. ML Score
    const mlScore = calculateMLScore(input, pattern)

    // 5. Adjusted confidence
    const adjustedConfidence = runConfidenceModel(input, pattern, performance)

    // 6. Prediction
    const prediction = runPredictionModel(input, pattern, performance, adjustedConfidence)

    return { mlScore, adjustedConfidence, prediction, performance, patternStats: pattern }
}