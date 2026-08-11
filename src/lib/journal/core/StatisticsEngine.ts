import { JournalEntry, JournalStats, SessionStats, PairStats } from '../types'

export function calculateStats(trades: JournalEntry[]): JournalStats {
    const closed = trades.filter((t) => t.result !== 'pending')
    const wins = closed.filter((t) => t.result === 'win')
    const losses = closed.filter((t) => t.result === 'loss')
    const be = closed.filter((t) => t.result === 'breakeven')

    const winRate = closed.length > 0 ? parseFloat(((wins.length / closed.length) * 100).toFixed(1)) : 0
    const avgRR = closed.length > 0 ? parseFloat((closed.reduce((a, t) => a + t.risk_reward, 0) / closed.length).toFixed(2)) : 0
    const totalPnl = parseFloat(closed.reduce((a, t) => a + t.pnl, 0).toFixed(2))
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0)
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99 : 1
    const avgWin = wins.length > 0 ? parseFloat((grossWin / wins.length).toFixed(2)) : 0
    const avgLoss = losses.length > 0 ? parseFloat((grossLoss / losses.length).toFixed(2)) : 0

    const bestTrade = closed.reduce((b, t) => !b || t.pnl > b.pnl ? t : b, null as JournalEntry | null)
    const worstTrade = closed.reduce((w, t) => !w || t.pnl < w.pnl ? t : w, null as JournalEntry | null)

    let maxW = 0, maxL = 0, curW = 0, curL = 0
    closed.forEach((t) => {
        if (t.result === 'win') { curW++; curL = 0; if (curW > maxW) maxW = curW }
        else if (t.result === 'loss') { curL++; curW = 0; if (curL > maxL) maxL = curL }
    })

    return {
        totalTrades: closed.length, wins: wins.length,
        losses: losses.length, breakeven: be.length,
        winRate, avgRR, totalPnl, profitFactor,
        avgWin, avgLoss, bestTrade, worstTrade,
        maxConsecutiveWins: maxW, maxConsecutiveLosses: maxL,
    }
}

export function calculateSessionStats(trades: JournalEntry[]): SessionStats[] {
    const map: Record<string, JournalEntry[]> = {}
    trades.filter((t) => t.result !== 'pending').forEach((t) => {
        if (!map[t.session]) map[t.session] = []
        map[t.session].push(t)
    })
    return Object.entries(map).map(([session, ts]) => {
        const wins = ts.filter((t) => t.result === 'win').length
        return {
            session,
            trades: ts.length,
            wins,
            winRate: parseFloat(((wins / ts.length) * 100).toFixed(1)),
            totalPnl: parseFloat(ts.reduce((a, t) => a + t.pnl, 0).toFixed(2)),
        }
    }).sort((a, b) => b.winRate - a.winRate)
}

export function calculatePairStats(trades: JournalEntry[]): PairStats[] {
    const map: Record<string, JournalEntry[]> = {}
    trades.filter((t) => t.result !== 'pending').forEach((t) => {
        if (!map[t.pair]) map[t.pair] = []
        map[t.pair].push(t)
    })
    return Object.entries(map).map(([pair, ts]) => {
        const wins = ts.filter((t) => t.result === 'win').length
        return {
            pair,
            trades: ts.length,
            wins,
            winRate: parseFloat(((wins / ts.length) * 100).toFixed(1)),
            avgRR: parseFloat((ts.reduce((a, t) => a + t.risk_reward, 0) / ts.length).toFixed(2)),
            totalPnl: parseFloat(ts.reduce((a, t) => a + t.pnl, 0).toFixed(2)),
        }
    }).sort((a, b) => b.winRate - a.winRate)
}