import { MLInput, MLOutput } from './types'
import { findPattern as findDBPattern } from './data/PatternDatabase'
import { calculatePerformance } from './models/PerformanceModel'
import { runPredictionModel } from './models/PredictionModel'
import { calculateMLScore } from './scoring/ScoreCalculator'
import { calculateAdaptiveConfidence } from './scoring/AdaptiveConfidence'
import { getSeedTrades } from './learning/HistoricalLearning'
import { findPattern as findHistoricalPattern } from './models/PatternModel'

export function runMLEngine(input: MLInput): MLOutput {
    // 1. All historical trades
    const allTrades = [...getSeedTrades(), ...input.historicalTrades]

    // 2. Pattern from database (rich seed data)
    const dbPattern = findDBPattern(input.pair, input.direction, input.session, input.setup)

    // 3. Pattern from historical trades
    const histPattern = findHistoricalPattern(allTrades, input.pair, input.direction, input.session)

    // 4. Use DB pattern if available, else historical
    const pattern = dbPattern
        ? {
            pair: dbPattern.pair,
            direction: dbPattern.direction,
            session: dbPattern.session,
            setup: dbPattern.setup,
            totalTrades: dbPattern.trades,
            wins: dbPattern.wins,
            losses: dbPattern.trades - dbPattern.wins,
            winRate: dbPattern.winRate,
            avgRR: dbPattern.avgRR,
            avgHoldingHours: dbPattern.avgHoldingHours,
            patternScore: Math.round(dbPattern.winRate * 0.6 + dbPattern.avgRR * 10 * 0.4),
        }
        : histPattern

    // 5. Overall performance
    const performance = calculatePerformance(allTrades)

    // 6. ML Score
    const mlScore = calculateMLScore(input, pattern)

    // 7. Adaptive Confidence
    const trendScore = input.ictScore
    const momentumScore = input.ictConfidence
    const historyScore = pattern ? pattern.winRate : performance.winRate
    const riskScore = input.riskRewardRatio >= 2 ? 90 : input.riskRewardRatio >= 1.5 ? 75 : 50
    const liquidityScore = pattern ? pattern.patternScore : 60

    const adaptiveResult = calculateAdaptiveConfidence(
        trendScore,
        momentumScore,
        historyScore,
        riskScore,
        liquidityScore
    )

    // 8. Prediction
    const prediction = runPredictionModel(
        input,
        pattern,
        performance,
        adaptiveResult.finalConfidence
    )

    return {
        mlScore,
        adjustedConfidence: adaptiveResult.finalConfidence,
        prediction: {
            ...prediction,
            components: adaptiveResult.components,
            reasons: [
                ...prediction.reasons,
                '',
                '── Adaptive Confidence Breakdown ──',
                ...adaptiveResult.breakdown,
                'Final Confidence = ' + adaptiveResult.finalConfidence + '%',
            ],
        },
        performance,
        patternStats: pattern,
    }
}