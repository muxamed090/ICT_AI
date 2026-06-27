import {
  AiDecisionMetrics,
  MlAccuracyMetrics,
  StrategyComparisonItem,
  StrategyComparisonResult,
} from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class DecisionComparisonEngine {
  /**
   * Computes AI decision pipeline accuracy metrics.
   */
  static computeAiDecisionMetrics(trades: BacktestTradeInput[]): AiDecisionMetrics {
    const withDecisions = trades.filter((t) => t.aiDecision !== null)
    const entryDecisions = withDecisions.filter((t) => t.aiDecisionType === 'ENTRY')
    const entryWins = entryDecisions.filter((t) => t.journalEntry.result === 'win').length

    const entryWinRate =
      entryDecisions.length > 0
        ? Number(((entryWins / entryDecisions.length) * 100).toFixed(2))
        : 0

    const watchDecisions = withDecisions.filter((t) => t.aiDecisionType === 'WATCH').length
    const waitDecisions = withDecisions.filter((t) => t.aiDecisionType === 'WAIT').length
    const ignoreDecisions = withDecisions.filter((t) => t.aiDecisionType === 'IGNORE').length

    const scores = withDecisions
      .map((t) => t.ictScore)
      .filter((s): s is number => typeof s === 'number')
    const avgConfluenceScore =
      scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0

    return {
      totalDecisions: withDecisions.length,
      entryDecisions: entryDecisions.length,
      entryWins,
      entryWinRate,
      watchDecisions,
      waitDecisions,
      ignoreDecisions,
      avgConfluenceScore,
    }
  }

  /**
   * Computes ML Prediction Engine accuracy metrics.
   */
  static computeMlAccuracy(trades: BacktestTradeInput[]): MlAccuracyMetrics {
    const withPredictions = trades.filter((t) => t.mlPrediction !== null)
    const correct = withPredictions.filter((t) => t.mlPrediction?.is_correct === true).length

    const accuracyRate =
      withPredictions.length > 0
        ? Number(((correct / withPredictions.length) * 100).toFixed(2))
        : 0

    const mlScores = withPredictions.map((t) => Number(t.mlPrediction?.ml_score || 0))
    const avgMlScore =
      mlScores.length > 0 ? Number((mlScores.reduce((a, b) => a + b, 0) / mlScores.length).toFixed(2)) : 0

    const confidences = withPredictions.map((t) => Number(t.mlPrediction?.ml_confidence || 0))
    const avgConfidence =
      confidences.length > 0
        ? Number((confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2))
        : 0

    return {
      totalPredictions: withPredictions.length,
      correctPredictions: correct,
      accuracyRate,
      avgMlScore,
      avgConfidence,
    }
  }

  /**
   * Builds a comparative summary across multiple strategy runs.
   */
  static compareMultiple(runs: Array<{ id: string; name: string; report: Record<string, unknown> }>): StrategyComparisonResult {
    const items: StrategyComparisonItem[] = runs.map((r) => {
      const rep = r.report
      const config = (rep.config as Record<string, unknown>) || {}
      return {
        runId: r.id,
        name: r.name || (config.name as string) || 'Run Snapshot',
        mlMode: (config.mlMode as StrategyComparisonItem['mlMode']) || 'rules_only',
        modelVersion: (rep.model_version as string) || (config.modelVersion as string) || 'ICT-AI-v1',
        winRate: typeof rep.winRate === 'number' ? rep.winRate : 0,
        profitFactor: typeof rep.profitFactor === 'number' ? rep.profitFactor : 0,
        sharpeRatio: typeof rep.sharpeRatio === 'number' ? rep.sharpeRatio : null,
        expectancy: typeof rep.expectancy === 'number' ? rep.expectancy : 0,
        maxDrawdownPct: typeof rep.maxDrawdownPct === 'number' ? rep.maxDrawdownPct : 0,
        netPnl: typeof rep.netPnl === 'number' ? rep.netPnl : 0,
        totalTrades: typeof rep.totalTrades === 'number' ? rep.totalTrades : 0,
      }
    })

    return { items }
  }
}
