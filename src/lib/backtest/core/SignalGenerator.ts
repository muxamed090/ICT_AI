import { Candle, BacktestConfig, BacktestTrade } from '../types'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runRulesEngine } from '@/lib/rules/RulesEngine'
import { runDecisionEngine } from '@/lib/decision/DecisionEngine'
import { getSessionFromHour, generateId } from '../utils'
import { MLInput } from '@/lib/ml/types'
import { RuleInput } from '@/lib/rules/types'
import { DecisionInput } from '@/lib/decision/types'

export function generateSignalFromCandle(
    candle: Candle,
    config: BacktestConfig
): BacktestTrade | null {
    const pair = config.pair
    const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
    const price = candle.close
    const open = candle.open
    const hour = new Date(candle.timestamp).getUTCHours()
    const session = getSessionFromHour(hour)

    // Only trade during active sessions
    if (session === 'asian' && !pair.includes('JPY')) return null

    // Determine direction
    const priceDiff = Math.abs(price - open)
    const score = Math.min(95, Math.round(55 + (priceDiff / open) * 8000))
    const confidence = Math.min(95, Math.round(50 + (priceDiff / open) * 10000))

    // Skip low-score setups
    if (score < 60) return null

    const rawDir = price >= open ? 'buy' : 'sell'
    const direction: 'buy' | 'sell' =
        config.direction === 'both' || !config.direction ? rawDir : config.direction

    const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
    const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
    const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip
    const rr = parseFloat((Math.abs(tp1 - price) / Math.abs(price - sl)).toFixed(2))

    // Run all engines
    const ictResult = runICTEngine({
        pair, direction, price, entry: price,
        stop_loss: sl, tp1, tp2, score, confidence,
        hasNewsRisk: false, newsWarning: null,
    })

    const mlResult = runMLEngine({
        pair, direction, session,
        setup: config.setup,
        ictScore: score,
        ictConfidence: confidence,
        riskRewardRatio: rr,
        historicalTrades: [],
    } as MLInput)

    const ruleInput: RuleInput = {
        pair, direction, price, entry: price,
        stop_loss: sl, tp1, tp2, score, confidence,
        session, timeframe: config.timeframe,
        hasNewsRisk: false, newsWarning: null,
        minutesToNews: 999,
        htfBias: direction === 'buy' ? 'bullish' : 'bearish',
        hasBOS: score >= 75,
        hasCHoCH: score >= 65,
        hasFVG: confidence >= 70,
        hasOrderBlock: confidence >= 65,
        hasLiquiditySweep: score >= 70,
        spreadPips: 1,
    }
    const rulesResult = runRulesEngine(ruleInput)

    const decisionInput: DecisionInput = {
        pair, direction, price, entry: price,
        stop_loss: sl, tp1, tp2,
        ictResult, mlResult, rulesResult,
        accountBalance: config.accountBalance,
        riskPercent: config.riskPercent,
    }
    const decision = runDecisionEngine(decisionInput)

    // Only take EXECUTE decisions
    if (decision.action !== 'BUY' && decision.action !== 'SELL') return null

    return {
        id: generateId(),
        pair,
        direction,
        entryPrice: price,
        stopLoss: sl,
        tp1,
        tp2,
        entryTime: candle.timestamp,
        outcome: 'pending',
        rrAchieved: 0,
        pnl: 0,
        ictScore: ictResult.confidence,
        mlScore: mlResult.adjustedConfidence,
        rulesGrade: rulesResult.grade,
        decisionScore: decision.confidence,
        session,
    }
}