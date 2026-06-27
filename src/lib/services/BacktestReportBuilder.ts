import {
  BacktestReport,
  BacktestConfig,
  EquityPoint,
  DrawdownPoint,
  PeriodPerformance,
  PairStat,
  SessionStat,
  IctSetupStat,
  MlAccuracyMetrics,
  AiDecisionMetrics,
  MonteCarloResult,
  WalkForwardResult,
} from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class BacktestReportBuilder {
  /**
   * Assembles disparate calculation outputs into a unified, versioned BacktestReport object.
   */
  static build(
    runId: string,
    config: BacktestConfig,
    trades: BacktestTradeInput[],
    equityCurve: EquityPoint[],
    drawdownCurve: DrawdownPoint[],
    maxDrawdown: number,
    maxDrawdownPct: number,
    sharpeRatio: number | null,
    dailyPerformance: PeriodPerformance[],
    weeklyPerformance: PeriodPerformance[],
    monthlyPerformance: PeriodPerformance[],
    pairStats: PairStat[],
    sessionStats: SessionStat[],
    ictSetupStats: IctSetupStat[],
    mlAccuracy: MlAccuracyMetrics,
    aiDecisionMetrics: AiDecisionMetrics,
    durationMs: number,
    monteCarlo?: MonteCarloResult,
    walkForward?: WalkForwardResult
  ): BacktestReport {
    const completed = trades.filter((t) => t.journalEntry.result !== 'pending')
    const winningTrades = completed.filter((t) => t.journalEntry.result === 'win').length
    const losingTrades = completed.filter((t) => t.journalEntry.result === 'loss').length
    const breakevenTrades = completed.filter((t) => t.journalEntry.result === 'breakeven').length

    const totalTrades = completed.length
    const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0
    const lossRate = totalTrades > 0 ? Number(((losingTrades / totalTrades) * 100).toFixed(2)) : 0

    const netPnl = Number(completed.reduce((sum, t) => sum + Number(t.journalEntry.pnl || 0), 0).toFixed(2))
    const grossProfit = Number(
      completed
        .filter((t) => t.journalEntry.result === 'win')
        .reduce((sum, t) => sum + Number(t.journalEntry.pnl || 0), 0)
        .toFixed(2)
    )
    const grossLoss = Number(
      completed
        .filter((t) => t.journalEntry.result === 'loss')
        .reduce((sum, t) => sum + Math.abs(Number(t.journalEntry.pnl || 0)), 0)
        .toFixed(2)
    )

    const profitFactor =
      grossLoss > 0
        ? Number((grossProfit / grossLoss).toFixed(2))
        : Number(grossProfit.toFixed(2))

    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0
    const expectancy =
      totalTrades > 0
        ? Number(((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss).toFixed(2))
        : 0

    const avgRR =
      totalTrades > 0
        ? Number(
            (
              completed.reduce((sum, t) => sum + Number(t.journalEntry.risk_reward || 0), 0) /
              totalTrades
            ).toFixed(2)
          )
        : 0

    return {
      runId,
      config,
      engineVersions: {
        rulesEngine: 'ICT-Rules-v1.0',
        decisionEngine: 'ICT-Decision-v1.0',
        mlEngine: 'ICT-ML-v1.0',
      },
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      winRate,
      lossRate,
      profitFactor,
      expectancy,
      avgRR,
      netPnl,
      grossProfit,
      grossLoss,
      maxDrawdown,
      maxDrawdownPct,
      sharpeRatio,
      equityCurve,
      drawdownCurve,
      dailyPerformance,
      weeklyPerformance,
      monthlyPerformance,
      pairStats,
      sessionStats,
      ictSetupStats,
      mlAccuracy,
      aiDecisionMetrics,
      monteCarlo,
      walkForward,
      generatedAt: new Date().toISOString(),
      durationMs,
    }
  }

  /** Serializes report to JSONB record */
  static serialize(report: BacktestReport): Record<string, unknown> {
    return report as unknown as Record<string, unknown>
  }

  /** Deserializes from JSONB record safely */
  static deserialize(raw: Record<string, unknown>): BacktestReport | null {
    if (!raw || typeof raw.runId !== 'string') return null
    return raw as unknown as BacktestReport
  }
}
