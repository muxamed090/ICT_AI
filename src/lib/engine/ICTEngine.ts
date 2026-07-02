import { SignalInput, EngineOutput, Recommendation } from './types'
import { runTrendEngine } from './engines/TrendEngine'
import { runMomentumEngine } from './engines/MomentumEngine'
import { runRiskEngine } from './engines/RiskEngine'
import { runRulesEngine } from './engines/RulesEngine'
import { runConfidenceEngine } from './engines/ConfidenceEngine'

export function runICTEngine(signal: SignalInput): EngineOutput {
    const riskResult = runRiskEngine(signal)
    if (riskResult.blocked) {
        return {
            pair: signal.pair,
            direction: signal.direction,
            recommendation: 'WAIT',
            confidence: 0,
            risk: 'High',
            marketBias: 'Neutral',
            trend: 'Sideways',
            momentum: 'Weak',
            entryQuality: 'Poor',
            riskRewardRatio: 0,
            reasons: [],
            warnings: riskResult.warnings,
            tradeSummary: `WAIT — ${riskResult.blockReason}. Do not enter until risk clears.`,
            entry: signal.entry,
            stop_loss: signal.stop_loss,
            tp1: signal.tp1,
            tp2: signal.tp2,
        }
    }

    const trendResult = runTrendEngine(signal)
    const momentumResult = runMomentumEngine(signal)
    const rulesResult = runRulesEngine(signal)
    const confidenceResult = runConfidenceEngine(
        signal.confidence,
        rulesResult,
        riskResult,
        momentumResult
    )

    const { confidence } = confidenceResult
    const isBuy = signal.direction === 'buy'
    let recommendation: Recommendation

    if (confidence >= 85) recommendation = isBuy ? 'STRONG BUY' : 'STRONG SELL'
    else if (confidence >= 65) recommendation = isBuy ? 'BUY' : 'SELL'
    else if (confidence >= 45) recommendation = 'WAIT'
    else recommendation = 'NO TRADE'

    const reasons = [
        ...trendResult.reasons,
        ...momentumResult.reasons,
        ...rulesResult.reasons,
    ]
    const warnings = [
        ...riskResult.warnings,
        ...rulesResult.warnings,
    ]

    const tradeSummary =
        `${recommendation} ${signal.pair} @ ${signal.entry.toFixed(5)} | ` +
        `SL: ${signal.stop_loss.toFixed(5)} | TP1: ${signal.tp1.toFixed(5)} | ` +
        `TP2: ${signal.tp2.toFixed(5)} | R:R ${riskResult.riskRewardRatio} | ` +
        `Confidence: ${confidence}% | Risk: ${riskResult.risk}`

    return {
        pair: signal.pair,
        direction: signal.direction,
        recommendation,
        confidence,
        risk: riskResult.risk,
        marketBias: trendResult.marketBias,
        trend: trendResult.trend,
        momentum: momentumResult.momentum,
        entryQuality: confidenceResult.entryQuality,
        riskRewardRatio: riskResult.riskRewardRatio,
        reasons,
        warnings,
        tradeSummary,
        entry: signal.entry,
        stop_loss: signal.stop_loss,
        tp1: signal.tp1,
        tp2: signal.tp2,
    }
}