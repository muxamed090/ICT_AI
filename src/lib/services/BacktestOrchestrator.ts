import {
  TradeJournal,
  AiDecision,
  MlPrediction,
  BacktestConfig,
  BacktestReport,
  BacktestTrade,
} from '@/types/database'
import { BacktestDataAdapter } from './BacktestDataAdapter'
import { EquityCurveCalculator } from './EquityCurveCalculator'
import { PerformanceAggregator } from './PerformanceAggregator'
import { DecisionComparisonEngine } from './DecisionComparisonEngine'
import { MonteCarloEngine } from './MonteCarloEngine'
import { WalkForwardEngine } from './WalkForwardEngine'
import { BacktestReportBuilder } from './BacktestReportBuilder'

export class BacktestOrchestrator {
  /**
   * Main pipeline coordinator. Executes all sub-services sequentially and returns the final report
   * and trade replay entries. Contains zero database side-effects.
   */
  static run(
    runId: string,
    userId: string,
    trades: TradeJournal[],
    decisions: AiDecision[],
    predictions: MlPrediction[],
    config: BacktestConfig
  ): {
    report: BacktestReport
    backtestTrades: Omit<BacktestTrade, 'id' | 'created_at'>[]
  } {
    const startTime = Date.now()

    // 1. Merge and filter trades
    const adaptedTrades = BacktestDataAdapter.adapt(trades, decisions, predictions, config)

    // Sort trades chronologically
    adaptedTrades.sort(
      (a, b) =>
        new Date(a.journalEntry.created_at).getTime() -
        new Date(b.journalEntry.created_at).getTime()
    )

    // 2. Equity & Drawdown trajectory calculation
    const { equityCurve, drawdownCurve, maxDrawdown, maxDrawdownPct } =
      EquityCurveCalculator.calculate(adaptedTrades, config.initialEquity)

    const pnlSeries = adaptedTrades
      .filter((t) => t.journalEntry.result !== 'pending')
      .map((t) => Number(t.journalEntry.pnl || 0))
    const sharpeRatio = EquityCurveCalculator.computeSharpeRatio(pnlSeries)

    // 3. Dimensional performance aggregations
    const dailyPerformance = PerformanceAggregator.byDay(adaptedTrades)
    const weeklyPerformance = PerformanceAggregator.byWeek(adaptedTrades)
    const monthlyPerformance = PerformanceAggregator.byMonth(adaptedTrades)
    const pairStats = PerformanceAggregator.byPair(adaptedTrades)
    const sessionStats = PerformanceAggregator.bySession(adaptedTrades)
    const ictSetupStats = PerformanceAggregator.bySetupType(adaptedTrades)

    // 4. AI & ML Accuracy metrics
    const aiDecisionMetrics = DecisionComparisonEngine.computeAiDecisionMetrics(adaptedTrades)
    const mlAccuracy = DecisionComparisonEngine.computeMlAccuracy(adaptedTrades)

    // 5. Advanced Analytics Engines (Monte Carlo & Walk Forward)
    const monteCarlo = MonteCarloEngine.simulate(adaptedTrades, config.initialEquity, 500)
    const walkForward = WalkForwardEngine.analyze(adaptedTrades, 4)

    const durationMs = Date.now() - startTime

    // 6. Build unified BacktestReport
    const report = BacktestReportBuilder.build(
      runId,
      config,
      adaptedTrades,
      equityCurve,
      drawdownCurve,
      maxDrawdown,
      maxDrawdownPct,
      sharpeRatio,
      dailyPerformance,
      weeklyPerformance,
      monthlyPerformance,
      pairStats,
      sessionStats,
      ictSetupStats,
      mlAccuracy,
      aiDecisionMetrics,
      durationMs,
      monteCarlo,
      walkForward
    )

    // 7. Map to BacktestTrade database records for trade replay timeline
    const backtestTrades: Omit<BacktestTrade, 'id' | 'created_at'>[] = adaptedTrades.map(
      (t, idx) => {
        const eqPt = equityCurve[idx + 1] || equityCurve[equityCurve.length - 1]
        const ddPt = drawdownCurve[idx + 1] || drawdownCurve[drawdownCurve.length - 1]

        return {
          backtest_run_id: runId,
          user_id: userId,
          journal_id: t.journalEntry.id,
          pair: t.journalEntry.pair,
          direction: t.journalEntry.direction,
          session: t.journalEntry.session,
          killzone: t.journalEntry.killzone,
          setup_type: t.journalEntry.setup_type || 'Unspecified',
          timeframe: t.journalEntry.timeframe,
          entry_price: Number(t.journalEntry.entry),
          stop_loss: Number(t.journalEntry.stop_loss),
          take_profit: Number(t.journalEntry.take_profit),
          risk_reward: Number(t.journalEntry.risk_reward),
          result: t.journalEntry.result,
          pnl: Number(t.journalEntry.pnl || 0),
          ict_score: t.ictScore,
          ml_score: t.mlScore,
          final_score: t.finalScore,
          ai_decision: t.aiDecisionType,
          ai_confidence: t.aiConfidence,
          running_equity: eqPt ? eqPt.equity : config.initialEquity,
          running_drawdown: ddPt ? ddPt.drawdownPct : 0,
          trade_index: idx + 1,
          traded_at: t.journalEntry.created_at,
        }
      }
    )

    return { report, backtestTrades }
  }
}
