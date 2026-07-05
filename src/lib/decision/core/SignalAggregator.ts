import { DecisionInput, AggregatedScore } from '../types'
import { clamp } from '../utils'

// Weights: ICT 30%, ML 35%, Rules 35%
const WEIGHTS = { ict: 0.30, ml: 0.35, rules: 0.35 }

export function aggregateSignals(input: DecisionInput): AggregatedScore {
    const ictScore = clamp(input.ictResult.confidence, 0, 100)
    const mlScore = clamp(input.mlResult.adjustedConfidence, 0, 100)
    const rulesScore = clamp(
        (input.rulesResult.totalScore / input.rulesResult.maxScore) * 100, 0, 100
    )

    const combinedScore = parseFloat((
        ictScore * WEIGHTS.ict +
        mlScore * WEIGHTS.ml +
        rulesScore * WEIGHTS.rules
    ).toFixed(1))

    const breakdown = [
        'ICT Engine:   ' + ictScore.toFixed(0) + ' × 30% = ' + (ictScore * WEIGHTS.ict).toFixed(1),
        'ML Engine:    ' + mlScore.toFixed(0) + ' × 35% = ' + (mlScore * WEIGHTS.ml).toFixed(1),
        'Rules Engine: ' + rulesScore.toFixed(0) + '% × 35% = ' + (rulesScore * WEIGHTS.rules).toFixed(1),
        '─────────────────────────────',
        'Combined Score = ' + combinedScore,
    ]

    return { ictScore, mlScore, rulesScore, combinedScore, breakdown }
}