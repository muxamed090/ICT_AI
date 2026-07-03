import { TradeRecord, PerformanceStats } from '../types'
import { average } from '../utils'

export function calculatePerformance(trades: TradeRecord[]): PerformanceStats {
    if (trades.length === 0) {
        return {
            totalTrades: 0, wins: 0, losses: 0, winRate: 0,
            avgRR: 0, bestPair: 'N/A', worstPair: 'N/A',
            bestSession: 'N/A', maxDrawdown: 0, profitFactor: 1,
        }
    }

    const wins = trades.filter((t) => t.outcome === 'win').length
    const losses = trades.filter((t) => t.outcome === 'loss').length
    const winRate = Math.round((wins / trades.length) * 100)
    const avgRR = parseFloat(average(trades.map((t) => t.rr_achieved)).toFixed(2))

    // Best/worst pair
    const pairMap: Record<string, { wins: number; total: number }> = {}
    trades.forEach((t) => {
        if (!pairMap[t.pair]) pairMap[t.pair] = { wins: 0, total: 0 }
        pairMap[t.pair].total++
        if (t.outcome === 'win') pairMap[t.pair].wins++
    })
    const pairRates = Object.entries(pairMap).map(([pair, s]) => ({
        pair, rate: s.wins / s.total
    }))
    pairRates.sort((a, b) => b.rate - a.rate)
    const bestPair = pairRates[0]?.pair ?? 'N/A'
    const worstPair = pairRates[pairRates.length - 1]?.pair ?? 'N/A'

    // Best session
    const sessionMap: Record<string, { wins: number; total: number }> = {}
    trades.forEach((t) => {
        if (!sessionMap[t.session]) sessionMap[t.session] = { wins: 0, total: 0 }
        sessionMap[t.session].total++
        if (t.outcome === 'win') sessionMap[t.session].wins++
    })
    const sessionRates = Object.entries(sessionMap).map(([s, v]) => ({
        session: s, rate: v.wins / v.total
    }))
    sessionRates.sort((a, b) => b.rate - a.rate)
    const bestSession = sessionRates[0]?.session ?? 'N/A'

    // Profit factor
    const grossWin = trades.filter((t) => t.outcome === 'win').reduce((a, t) => a + t.rr_achieved, 0)
    const grossLoss = trades.filter((t) => t.outcome === 'loss').reduce((a, t) => a + Math.abs(t.rr_achieved), 0)
    const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99 : 1

    return {
        totalTrades: trades.length, wins, losses, winRate, avgRR,
        bestPair, worstPair, bestSession, maxDrawdown: 0, profitFactor,
    }
}