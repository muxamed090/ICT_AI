import { StatusCheck } from '../types'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runRulesEngine } from '@/lib/rules/RulesEngine'
import { runDecisionEngine } from '@/lib/decision/DecisionEngine'

function timeMs(): number { return Date.now() }

export function checkICTEngine(): StatusCheck {
    const start = timeMs()
    try {
        runICTEngine({
            pair: 'EURUSD', direction: 'buy', price: 1.1, entry: 1.1,
            stop_loss: 1.098, tp1: 1.103, tp2: 1.106,
            score: 80, confidence: 80, hasNewsRisk: false, newsWarning: null,
        })
        return {
            name: 'ICT Engine',
            status: 'healthy',
            message: 'ICT Engine running normally',
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    } catch (err) {
        return {
            name: 'ICT Engine',
            status: 'error',
            message: 'ICT Engine error: ' + String(err),
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}

export function checkMLEngine(): StatusCheck {
    const start = timeMs()
    try {
        runMLEngine({
            pair: 'EURUSD', direction: 'buy', session: 'london',
            setup: 'BOS+FVG', ictScore: 80, ictConfidence: 80,
            riskRewardRatio: 1.5, historicalTrades: [],
        })
        return {
            name: 'ML Engine',
            status: 'healthy',
            message: 'ML Engine running normally',
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    } catch (err) {
        return {
            name: 'ML Engine',
            status: 'error',
            message: 'ML Engine error: ' + String(err),
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}

export function checkRulesEngine(): StatusCheck {
    const start = timeMs()
    try {
        runRulesEngine({
            pair: 'EURUSD', direction: 'buy', price: 1.1, entry: 1.1,
            stop_loss: 1.098, tp1: 1.103, tp2: 1.106,
            score: 80, confidence: 80, session: 'london',
            hasNewsRisk: false, newsWarning: null, minutesToNews: 999,
            htfBias: 'bullish', hasBOS: true, hasCHoCH: true,
            hasFVG: true, hasOrderBlock: true, hasLiquiditySweep: true,
            spreadPips: 1,
        })
        return {
            name: 'Rules Engine',
            status: 'healthy',
            message: 'Rules Engine running normally',
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    } catch (err) {
        return {
            name: 'Rules Engine',
            status: 'error',
            message: 'Rules Engine error: ' + String(err),
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}

export function checkDecisionEngine(): StatusCheck {
    const start = timeMs()
    try {
        const ict = runICTEngine({ pair: 'EURUSD', direction: 'buy', price: 1.1, entry: 1.1, stop_loss: 1.098, tp1: 1.103, tp2: 1.106, score: 80, confidence: 80, hasNewsRisk: false, newsWarning: null })
        const ml = runMLEngine({ pair: 'EURUSD', direction: 'buy', session: 'london', setup: 'BOS+FVG', ictScore: 80, ictConfidence: 80, riskRewardRatio: 1.5, historicalTrades: [] })
        const rules = runRulesEngine({ pair: 'EURUSD', direction: 'buy', price: 1.1, entry: 1.1, stop_loss: 1.098, tp1: 1.103, tp2: 1.106, score: 80, confidence: 80, session: 'london', hasNewsRisk: false, newsWarning: null, minutesToNews: 999, htfBias: 'bullish', hasBOS: true, hasCHoCH: true, hasFVG: true, hasOrderBlock: true, hasLiquiditySweep: true, spreadPips: 1 })
        runDecisionEngine({ pair: 'EURUSD', direction: 'buy', price: 1.1, entry: 1.1, stop_loss: 1.098, tp1: 1.103, tp2: 1.106, ictResult: ict, mlResult: ml, rulesResult: rules, accountBalance: 10000, riskPercent: 1 })
        return {
            name: 'Decision Engine',
            status: 'healthy',
            message: 'Decision Engine running normally',
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    } catch (err) {
        return {
            name: 'Decision Engine',
            status: 'error',
            message: 'Decision Engine error: ' + String(err),
            responseTime: timeMs() - start,
            lastChecked: new Date().toISOString(),
        }
    }
}