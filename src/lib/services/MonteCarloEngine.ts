import { MonteCarloResult, MonteCarloSimulationRun } from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class MonteCarloEngine {
  /**
   * Runs Monte Carlo simulation by shuffling historical trade return sequences
   * over a specified number of runs (e.g. 100, 500, 1000).
   */
  static simulate(
    trades: BacktestTradeInput[],
    initialEquity: number = 100000,
    numSimulations: number = 500
  ): MonteCarloResult {
    const completed = trades.filter((t) => t.journalEntry.result !== 'pending')
    if (completed.length === 0) {
      return {
        simulationsCount: 0,
        worstDrawdownPct: 0,
        bestEquity: initialEquity,
        medianReturn: 0,
        averageReturn: 0,
        probabilityOfProfit: 0,
        runs: [],
      }
    }

    const pnls = completed.map((t) => Number(t.journalEntry.pnl || 0))
    const runs: MonteCarloSimulationRun[] = []
    let profitableRuns = 0

    for (let sim = 0; sim < numSimulations; sim++) {
      // Create a randomized permutation of PnL values (Fisher-Yates shuffle copy)
      const shuffled = [...pnls]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j]
        shuffled[j] = temp
      }

      let equity = initialEquity
      let peak = initialEquity
      let maxDD = 0

      for (const pnl of shuffled) {
        equity += pnl
        if (equity > peak) peak = equity
        const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0
        if (dd > maxDD) maxDD = dd
      }

      const netPnl = equity - initialEquity
      if (netPnl > 0) profitableRuns++

      runs.push({
        runIndex: sim + 1,
        finalEquity: Number(equity.toFixed(2)),
        maxDrawdownPct: Number(maxDD.toFixed(2)),
        netPnl: Number(netPnl.toFixed(2)),
      })
    }

    // Sort runs by final equity to find median, best, worst
    const sortedByEquity = [...runs].sort((a, b) => a.finalEquity - b.finalEquity)
    const sortedByDD = [...runs].sort((a, b) => b.maxDrawdownPct - a.maxDrawdownPct)

    const worstDrawdownPct = sortedByDD.length > 0 ? sortedByDD[0].maxDrawdownPct : 0
    const bestEquity = sortedByEquity.length > 0 ? sortedByEquity[sortedByEquity.length - 1].finalEquity : initialEquity
    const medianRun = sortedByEquity[Math.floor(sortedByEquity.length / 2)]
    const medianReturn = medianRun ? medianRun.netPnl : 0

    const totalNetPnl = runs.reduce((acc, r) => acc + r.netPnl, 0)
    const averageReturn = Number((totalNetPnl / numSimulations).toFixed(2))
    const probabilityOfProfit = Number(((profitableRuns / numSimulations) * 100).toFixed(2))

    return {
      simulationsCount: numSimulations,
      worstDrawdownPct,
      bestEquity,
      medianReturn,
      averageReturn,
      probabilityOfProfit,
      runs: sortedByEquity.slice(0, 50), // Return top 50 sample runs for UI rendering efficiency
    }
  }
}
