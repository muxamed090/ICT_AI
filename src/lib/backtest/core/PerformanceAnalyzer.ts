import { BacktestTrade, EquityPoint, BacktestConfig } from '../types'

export function analyzePerformance(
    trades: BacktestTrade[],
    config: BacktestConfig
): {
    wins: number
    losses: number
    winRate: number
    avgRR: number
    profitFactor: number
    maxDrawdown: number
    totalPnl: number
    finalEquity: number
    equityCurve: EquityPoint[]
    pairPerformance: Record<string, { wins: number; losses: number; winRate: number; avgRR: number }>
    sessionPerformance: Record<string, { wins: number; losses: number; winRate: number }>
    bestTrade: BacktestTrade | null
    worstTrade: BacktestTrade | null
} {
    const closed = trades.filter((t) => t.outcome !== 'pending')
    const wins = closed.filter((t) => t.outcome === 'win').length
    const losses = closed.filter((t) => t.outcome === 'loss').length
    const winRate = closed.length > 0 ? parseFloat(((wins / closed.length) * 100).toFixed(1)) : 0

    const avgRR = closed.length > 0
        ? parseFloat((closed.reduce((a, t) => a + t.rrAchieved, 0) / closed.length).toFixed(2))
        : 0

    const grossWin = closed.filter((t) => t.pnl > 0).reduce((a, t) => a + t.pnl, 0)
    const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99 : 1

    const totalPnl = parseFloat(closed.reduce((a, t) => a + t.pnl, 0).toFixed(2))
    const finalEquity = parseFloat((config.accountBalance + totalPnl).toFixed(2))

    // Equity curve + max drawdown
    let equity = config.accountBalance
    let peak = equity
    let maxDrawdown = 0
    const equityCurve: EquityPoint[] = []

    closed.forEach((t) => {
        equity += t.pnl
        if (equity > peak) peak = equity
        const dd = parseFloat((((peak - equity) / peak) * 100).toFixed(2))
        if (dd > maxDrawdown) maxDrawdown = dd
        equityCurve.push({
            time: t.exitTime ?? t.entryTime,
            equity: parseFloat(equity.toFixed(2)),
            drawdown: dd,
        })
    })

    // Pair performance
    const pairMap: Record<string, BacktestTrade[]> = {}
    closed.forEach((t) => {
        if (!pairMap[t.pair]) pairMap[t.pair] = []
        pairMap[t.pair].push(t)
    })
    const pairPerformance: Record<string, { wins: number; losses: number; winRate: number; avgRR: number }> = {}
    Object.entries(pairMap).forEach(([pair, ts]) => {
        const w = ts.filter((t) => t.outcome === 'win').length
        const l = ts.filter((t) => t.outcome === 'loss').length
        pairPerformance[pair] = {
            wins: w, losses: l,
            winRate: parseFloat(((w / ts.length) * 100).toFixed(1)),
            avgRR: parseFloat((ts.reduce((a, t) => a + t.rrAchieved, 0) / ts.length).toFixed(2)),
        }
    })

    // Session performance
    const sessionMap: Record<string, BacktestTrade[]> = {}
    closed.forEach((t) => {
        if (!sessionMap[t.session]) sessionMap[t.session] = []
        sessionMap[t.session].push(t)
    })
    const sessionPerformance: Record<string, { wins: number; losses: number; winRate: number }> = {}
    Object.entries(sessionMap).forEach(([s, ts]) => {
        const w = ts.filter((t) => t.outcome === 'win').length
        sessionPerformance[s] = {
            wins: w, losses: ts.length - w,
            winRate: parseFloat(((w / ts.length) * 100).toFixed(1)),
        }
    })

    const bestTrade = closed.reduce((best, t) => !best || t.pnl > best.pnl ? t : best, null as BacktestTrade | null)
    const worstTrade = closed.reduce((worst, t) => !worst || t.pnl < worst.pnl ? t : worst, null as BacktestTrade | null)

    return {
        wins, losses, winRate, avgRR, profitFactor,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        totalPnl, finalEquity, equityCurve,
        pairPerformance, sessionPerformance,
        bestTrade, worstTrade,
    }
}