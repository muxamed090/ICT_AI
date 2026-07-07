import { TradingState } from '../types'

export interface RiskCheckResult {
    approved: boolean
    reason?: string
    warnings: string[]
}

export function checkRisk(
    state: TradingState,
    riskAmount: number,
    pair: string
): RiskCheckResult {
    const warnings: string[] = []

    // 1. Daily drawdown limit
    if (state.dailyDrawdown >= state.maxDailyDrawdown) {
        return {
            approved: false,
            reason: 'Daily drawdown limit reached: ' + state.dailyDrawdown.toFixed(1) + '%',
            warnings,
        }
    }

    // 2. Max open positions (3)
    if (state.openPositions.length >= 3) {
        return {
            approved: false,
            reason: 'Max open positions reached (3)',
            warnings,
        }
    }

    // 3. Max daily trades (5)
    if (state.todayTrades >= 5) {
        return {
            approved: false,
            reason: 'Max daily trades reached (5)',
            warnings,
        }
    }

    // 4. Already trading this pair
    const existingPair = state.openPositions.find((p) => p.pair === pair)
    if (existingPair) {
        warnings.push('Already have an open position on ' + pair)
    }

    // 5. Risk amount vs balance
    const riskPct = (riskAmount / state.accountBalance) * 100
    if (riskPct > 2) {
        warnings.push('Risk ' + riskPct.toFixed(1) + '% exceeds recommended 2%')
    }

    return { approved: true, warnings }
}