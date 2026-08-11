import { JournalEntry, PerformanceData } from '../types'

export function trackPerformance(
    trades: JournalEntry[],
    startingBalance: number
): PerformanceData {
    const closed = trades
        .filter((t) => t.result !== 'pending' && t.created_at)
        .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())

    let equity = startingBalance
    let peak = equity
    let maxDrawdown = 0
    const equityCurve: PerformanceData['equityCurve'] = []

    closed.forEach((t) => {
        equity += t.pnl
        if (equity > peak) peak = equity
        const dd = parseFloat((((peak - equity) / peak) * 100).toFixed(2))
        if (dd > maxDrawdown) maxDrawdown = dd
        equityCurve.push({
            date: t.created_at!.split('T')[0],
            equity: parseFloat(equity.toFixed(2)),
            drawdown: dd,
        })
    })

    // Monthly P&L
    const monthlyPnl: Record<string, number> = {}
    closed.forEach((t) => {
        const month = t.created_at!.slice(0, 7)
        monthlyPnl[month] = parseFloat(((monthlyPnl[month] ?? 0) + t.pnl).toFixed(2))
    })

    // Expectancy: (WinRate × AvgWin) - (LossRate × AvgLoss)
    const wins = closed.filter((t) => t.result === 'win')
    const losses = closed.filter((t) => t.result === 'loss')
    const winRate = closed.length > 0 ? wins.length / closed.length : 0
    const lossRate = 1 - winRate
    const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length) : 0
    const expectancy = parseFloat((winRate * avgWin - lossRate * avgLoss).toFixed(2))

    // Sharpe ratio (simplified)
    const returns = equityCurve.map((p, i) =>
        i === 0 ? 0 : (p.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity
    )
    const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1)
    const stdDev = Math.sqrt(returns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1))
    const sharpeRatio = stdDev > 0 ? parseFloat((avgReturn / stdDev).toFixed(2)) : 0

    return { equityCurve, maxDrawdown, sharpeRatio, expectancy, monthlyPnl }
}