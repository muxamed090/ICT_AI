import { DrawdownPoint, DrawdownPeriod } from '@/types/database'

export class DrawdownAnalyzer {
  /**
   * Analyzes drawdown curves to extract discrete underwater periods, recovery durations, and peak drawdown metrics.
   */
  static analyze(drawdownCurve: DrawdownPoint[]): {
    periods: DrawdownPeriod[]
    longestDrawdownTrades: number
    avgRecoveryTrades: number
    currentDrawdownPct: number
  } {
    const periods: DrawdownPeriod[] = []
    let inDrawdown = false
    let currentPeriod: Partial<DrawdownPeriod> | null = null

    for (let i = 0; i < drawdownCurve.length; i++) {
      const pt = drawdownCurve[i]

      if (pt.drawdownPct > 0 && !inDrawdown) {
        inDrawdown = true
        currentPeriod = {
          startIndex: pt.tradeIndex,
          startAt: pt.tradedAt,
          peakEquity: pt.equity + pt.drawdown,
          troughEquity: pt.equity,
          maxDrawdownPct: pt.drawdownPct,
          tradesInDrawdown: 1,
          recoveredAt: null,
        }
      } else if (inDrawdown && currentPeriod) {
        if (pt.drawdownPct === 0) {
          // Recovered from drawdown
          inDrawdown = false
          currentPeriod.recoveredAt = pt.tradedAt
          currentPeriod.endIndex = pt.tradeIndex
          currentPeriod.endAt = pt.tradedAt
          periods.push(currentPeriod as DrawdownPeriod)
          currentPeriod = null
        } else {
          // Still in drawdown
          currentPeriod.tradesInDrawdown = (currentPeriod.tradesInDrawdown || 0) + 1
          if (pt.equity < (currentPeriod.troughEquity || Infinity)) {
            currentPeriod.troughEquity = pt.equity
          }
          if (pt.drawdownPct > (currentPeriod.maxDrawdownPct || 0)) {
            currentPeriod.maxDrawdownPct = pt.drawdownPct
          }
        }
      }
    }

    if (inDrawdown && currentPeriod) {
      currentPeriod.endIndex = drawdownCurve[drawdownCurve.length - 1].tradeIndex
      currentPeriod.endAt = drawdownCurve[drawdownCurve.length - 1].tradedAt
      periods.push(currentPeriod as DrawdownPeriod)
    }

    const longestDrawdownTrades =
      periods.length > 0 ? Math.max(...periods.map((p) => p.tradesInDrawdown)) : 0

    const recoveredPeriods = periods.filter((p) => p.recoveredAt !== null)
    const avgRecoveryTrades =
      recoveredPeriods.length > 0
        ? Number(
            (
              recoveredPeriods.reduce((acc, p) => acc + p.tradesInDrawdown, 0) /
              recoveredPeriods.length
            ).toFixed(1)
          )
        : 0

    const currentDrawdownPct =
      drawdownCurve.length > 0 ? drawdownCurve[drawdownCurve.length - 1].drawdownPct : 0

    return {
      periods,
      longestDrawdownTrades,
      avgRecoveryTrades,
      currentDrawdownPct,
    }
  }
}
