import { RuleInput, RuleResult } from '../types'
import { isLondonSession, isNewYorkSession, isAsianSession, isOverlap } from '../utils'

export function runSessionRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []
    const isLondon = isLondonSession()
    const isNY = isNewYorkSession()
    const isAsian = isAsianSession()
    const isOv = isOverlap()

    // Rule 1: Trading during active session
    const isActiveSession = isLondon || isNY || isOv
    results.push({
        ruleName: 'Active Session',
        passed: isActiveSession,
        score: isActiveSession ? 10 : 0,
        reason: isActiveSession
            ? 'Trading during active session — liquidity available'
            : 'Asian session — low liquidity, avoid trading',
        warning: isAsian ? 'Asian session has low volume and wide spreads' : undefined,
    })

    // Rule 2: Pair-session alignment
    const pair = input.pair
    let pairSessionOk = true
    let pairSessionReason = 'Pair-session alignment acceptable'

    if (pair === 'EURJPY' && !isLondon && !isOv) {
        pairSessionOk = false
        pairSessionReason = 'EURJPY best traded during London/Overlap session'
    } else if (pair === 'XAUUSD' && isAsian) {
        pairSessionOk = false
        pairSessionReason = 'XAUUSD avoid Asian session — low gold volatility'
    } else if ((pair === 'EURUSD' || pair === 'GBPUSD') && isLondon) {
        pairSessionReason = 'EUR/GBP pairs optimal during London session'
    } else if ((pair === 'USDCAD' || pair === 'USDCHF') && isNY) {
        pairSessionReason = 'USD pairs optimal during NY session'
    }

    results.push({
        ruleName: 'Pair-Session Alignment',
        passed: pairSessionOk,
        score: pairSessionOk ? 10 : 0,
        reason: pairSessionReason,
    })

    return results
}