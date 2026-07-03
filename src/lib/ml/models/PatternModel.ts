import { TradeRecord, PatternStats } from '../types'
import { average } from '../utils'

export function findPattern(
    trades: TradeRecord[],
    pair: string,
    direction: 'buy' | 'sell',
    session: string
): PatternStats | null {
    const matched = trades.filter(
        (t) => t.pair === pair && t.direction === direction && t.session === session
    )
    if (matched.length === 0) return null

    const wins = matched.filter((t) => t.outcome === 'win').length
    const losses = matched.filter((t) => t.outcome === 'loss').length
    const winRate = Math.round((wins / matched.length) * 100)
    const avgRR = parseFloat(average(matched.map((t) => t.rr_achieved)).toFixed(2))
    const avgHoldingHours = parseFloat(average(matched.map((t) => t.holding_hours)).toFixed(1))
    const patternScore = Math.round(winRate * 0.6 + avgRR * 10 * 0.4)

    return {
        pair,
        direction,
        session,
        setup: matched[0].setup,
        totalTrades: matched.length,
        wins,
        losses,
        winRate,
        avgRR,
        avgHoldingHours,
        patternScore,
    }
}