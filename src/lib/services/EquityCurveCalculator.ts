import { EquityPoint, DrawdownPoint } from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class EquityCurveCalculator {
  /**
   * Computes the running equity trajectory, drawdown points, peak equity, and maximum drawdowns.
   */
  static calculate(
    trades: BacktestTradeInput[],
    initialEquity: number
  ): {
    equityCurve: EquityPoint[]
    drawdownCurve: DrawdownPoint[]
    maxDrawdown: number
    maxDrawdownPct: number
    finalEquity: number
  } {
    let currentEquity = initialEquity
    let peakEquity = initialEquity
    let maxDrawdown = 0
    let maxDrawdownPct = 0

    const equityCurve: EquityPoint[] = []
    const drawdownCurve: DrawdownPoint[] = []

    // Initial starting point
    equityCurve.push({
      tradeIndex: 0,
      tradedAt: trades.length > 0 ? trades[0].journalEntry.created_at : new Date().toISOString(),
      equity: initialEquity,
      pnl: 0,
      pair: 'START',
      result: 'pending',
    })

    drawdownCurve.push({
      tradeIndex: 0,
      tradedAt: trades.length > 0 ? trades[0].journalEntry.created_at : new Date().toISOString(),
      drawdown: 0,
      drawdownPct: 0,
      equity: initialEquity,
    })

    trades.forEach((trade, idx) => {
      const pnl = Number(trade.journalEntry.pnl || 0)
      currentEquity += pnl

      if (currentEquity > peakEquity) {
        peakEquity = currentEquity
      }

      const dd = peakEquity - currentEquity
      const ddPct = peakEquity > 0 ? (dd / peakEquity) * 100 : 0

      if (dd > maxDrawdown) maxDrawdown = Number(dd.toFixed(2))
      if (ddPct > maxDrawdownPct) maxDrawdownPct = Number(ddPct.toFixed(2))

      equityCurve.push({
        tradeIndex: idx + 1,
        tradedAt: trade.journalEntry.created_at,
        equity: Number(currentEquity.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        pair: trade.journalEntry.pair,
        result: trade.journalEntry.result,
      })

      drawdownCurve.push({
        tradeIndex: idx + 1,
        tradedAt: trade.journalEntry.created_at,
        drawdown: Number(dd.toFixed(2)),
        drawdownPct: Number(ddPct.toFixed(2)),
        equity: Number(currentEquity.toFixed(2)),
      })
    })

    return {
      equityCurve,
      drawdownCurve,
      maxDrawdown,
      maxDrawdownPct,
      finalEquity: Number(currentEquity.toFixed(2)),
    }
  }

  /**
   * Computes the annualized Sharpe ratio based on trade PnL series (assuming risk-free rate = 0).
   * Returns null if sample size is less than 2.
   */
  static computeSharpeRatio(pnlSeries: number[]): number | null {
    if (pnlSeries.length < 2) return null

    const mean = pnlSeries.reduce((a, b) => a + b, 0) / pnlSeries.length
    const variance =
      pnlSeries.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (pnlSeries.length - 1)
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) return 0

    // Annualized factor assuming ~250 trading sessions per year
    const sharpe = (mean / stdDev) * Math.sqrt(Math.min(250, pnlSeries.length))
    return Number(sharpe.toFixed(4))
  }
}
