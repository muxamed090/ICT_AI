import { clamp } from '../utils'

export interface ConfidenceComponents {
    trend: number
    momentum: number
    history: number
    risk: number
    liquidity: number
}

export interface AdaptiveConfidenceResult {
    components: ConfidenceComponents
    finalConfidence: number
    breakdown: string[]
}

export function calculateAdaptiveConfidence(
    trendScore: number,
    momentumScore: number,
    winRate: number,
    riskScore: number,
    patternScore: number
): AdaptiveConfidenceResult {
    // Each component 0-100
    const trend = clamp(trendScore, 0, 100)
    const momentum = clamp(momentumScore, 0, 100)
    const history = clamp(winRate, 0, 100)
    const risk = clamp(riskScore, 0, 100)
    const liquidity = clamp(patternScore, 0, 100)

    // Weighted average
    // Trend 25%, Momentum 20%, History 30%, Risk 15%, Liquidity 10%
    const finalConfidence = Math.round(
        trend * 0.25 +
        momentum * 0.20 +
        history * 0.30 +
        risk * 0.15 +
        liquidity * 0.10
    )

    const breakdown: string[] = [
        'Trend ............ ' + trend + '%',
        'Momentum ......... ' + momentum + '%',
        'History .......... ' + history + '%',
        'Risk ............. ' + risk + '%',
        'Liquidity ........ ' + liquidity + '%',
    ]

    return {
        components: { trend, momentum, history, risk, liquidity },
        finalConfidence: clamp(finalConfidence, 0, 99),
        breakdown,
    }
}