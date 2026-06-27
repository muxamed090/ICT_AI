"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TradeJournalRepository } from '@/lib/repositories/TradeJournalRepository'
import { AiDecisionRepository } from '@/lib/repositories/AiDecisionRepository'
import { MlPredictionRepository } from '@/lib/repositories/MlPredictionRepository'
import { BacktestRunRepository } from '@/lib/repositories/BacktestRunRepository'
import { BacktestTradeRepository } from '@/lib/repositories/BacktestTradeRepository'
import { BacktestOrchestrator } from '@/lib/services/BacktestOrchestrator'
import { BacktestReportBuilder } from '@/lib/services/BacktestReportBuilder'
import { DecisionComparisonEngine } from '@/lib/services/DecisionComparisonEngine'
import { ExportEngine } from '@/lib/services/ExportEngine'
import { backtestConfigSchema, compareRunsSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { handleActionError } from '@/lib/services/errorHandler'
import {
  BacktestReport,
  BacktestRun,
  BacktestTrade,
  StrategyComparisonResult,
  BacktestConfig,
} from '@/types/database'

/**
 * Executes a full backtest simulation against historical trade data and persists the results.
 */
export async function runBacktestAction(
  configInput: unknown
): Promise<ActionResult<BacktestReport>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const config = backtestConfigSchema.parse(configInput) as BacktestConfig

    // Fetch required historical repositories
    const journalRepo = new TradeJournalRepository(supabase)
    const decisionRepo = new AiDecisionRepository(supabase)
    const predictionRepo = new MlPredictionRepository(supabase)

    const [trades, decisions, predictions] = await Promise.all([
      journalRepo.getAll(user.id),
      decisionRepo.getByUser(user.id),
      predictionRepo.getByUser(user.id, 500),
    ])

    const completedTrades = trades.filter((t) => t.result !== 'pending')
    if (completedTrades.length < config.minSampleSize) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: `Insufficient historical trades: ${completedTrades.length} completed trades available, ${config.minSampleSize} required for backtesting.`,
        },
      }
    }

    // Generate pseudo ID for orchestrator run
    const tempRunId = crypto.randomUUID()

    // Execute pure business orchestrator
    const { report, backtestTrades } = BacktestOrchestrator.run(
      tempRunId,
      user.id,
      trades,
      decisions,
      predictions,
      config
    )

    // Persist to database
    const runRepo = new BacktestRunRepository(supabase)
    const tradeRepo = new BacktestTradeRepository(supabase)

    const savedRun = await runRepo.create({
      user_id: user.id,
      name: config.name,
      description: config.description || null,
      ml_mode: config.mlMode,
      model_version: report.config.mlMode === 'rules_only' ? 'ICT-Rules-Only' : 'ICT-ML-v1',
      rules_engine_version: report.engineVersions.rulesEngine,
      decision_engine_version: report.engineVersions.decisionEngine,
      ml_engine_version: report.engineVersions.mlEngine,
      date_from: config.dateFrom,
      date_to: config.dateTo,
      pair_filter: config.pairFilter.length > 0 ? config.pairFilter : null,
      session_filter: config.sessionFilter.length > 0 ? config.sessionFilter : null,
      total_trades: report.totalTrades,
      winning_trades: report.winningTrades,
      losing_trades: report.losingTrades,
      breakeven_trades: report.breakevenTrades,
      win_rate: report.winRate,
      loss_rate: report.lossRate,
      profit_factor: report.profitFactor,
      expectancy: report.expectancy,
      avg_rr: report.avgRR,
      net_pnl: report.netPnl,
      gross_profit: report.grossProfit,
      gross_loss: report.grossLoss,
      max_drawdown: report.maxDrawdown,
      max_drawdown_pct: report.maxDrawdownPct,
      sharpe_ratio: report.sharpeRatio,
      report: BacktestReportBuilder.serialize({ ...report, runId: tempRunId }),
      status: 'completed',
    })

    // Update run ID on trades and bulk insert
    const tradesToInsert = backtestTrades.map((t) => ({
      ...t,
      backtest_run_id: savedRun.id,
    }))
    await tradeRepo.bulkCreate(tradesToInsert)

    // Update final report runId
    const finalReport: BacktestReport = { ...report, runId: savedRun.id }

    revalidatePath('/dashboard/backtesting')

    return { success: true, data: finalReport }
  } catch (err) {
    return handleActionError<BacktestReport>(err)
  }
}

/**
 * Fetches lightweight summaries of all historical backtest runs for the user.
 */
export async function getBacktestRunsAction(): Promise<ActionResult<Omit<BacktestRun, 'report'>[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const runRepo = new BacktestRunRepository(supabase)
    const summaries = await runRepo.getSummaries(user.id)

    return { success: true, data: summaries }
  } catch (err) {
    return handleActionError<Omit<BacktestRun, 'report'>[]>(err)
  }
}

/**
 * Fetches full BacktestReport details for a specific run ID.
 */
export async function getBacktestReportAction(runId: string): Promise<ActionResult<BacktestReport>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const runRepo = new BacktestRunRepository(supabase)
    const run = await runRepo.getById(runId)
    if (!run) {
      return { success: false, error: { type: 'database', message: 'Backtest run not found.' } }
    }

    const report = BacktestReportBuilder.deserialize(run.report)
    if (!report) {
      return { success: false, error: { type: 'database', message: 'Failed to parse backtest report payload.' } }
    }

    return { success: true, data: report }
  } catch (err) {
    return handleActionError<BacktestReport>(err)
  }
}

/**
 * Fetches trade replay list for a specific run ID.
 */
export async function getBacktestTradesAction(runId: string): Promise<ActionResult<BacktestTrade[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const tradeRepo = new BacktestTradeRepository(supabase)
    const trades = await tradeRepo.getByRun(runId)

    return { success: true, data: trades }
  } catch (err) {
    return handleActionError<BacktestTrade[]>(err)
  }
}

/**
 * Deletes a backtest run and its associated trade replay records.
 */
export async function deleteBacktestRunAction(runId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const runRepo = new BacktestRunRepository(supabase)
    await runRepo.delete(runId)

    revalidatePath('/dashboard/backtesting')
    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}

/**
 * Compares multiple backtest runs side-by-side.
 */
export async function compareBacktestRunsAction(
  runIdsInput: unknown
): Promise<ActionResult<StrategyComparisonResult>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const { runIds } = compareRunsSchema.parse(runIdsInput)
    const runRepo = new BacktestRunRepository(supabase)

    const fetchedRuns = await Promise.all(runIds.map((id) => runRepo.getById(id)))
    const validRuns = fetchedRuns.filter((r): r is BacktestRun => r !== null)

    const comparison = DecisionComparisonEngine.compareMultiple(
      validRuns.map((r) => ({
        id: r.id,
        name: r.name,
        report: r.report,
      }))
    )

    return { success: true, data: comparison }
  } catch (err) {
    return handleActionError<StrategyComparisonResult>(err)
  }
}

/**
 * Exports a backtest run in JSON, CSV, or PDF summary text format.
 */
export async function exportBacktestRunAction(
  runId: string,
  format: 'json' | 'csv' | 'pdf'
): Promise<ActionResult<{ filename: string; content: string; mimeType: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized session.' } }
    }

    const runRepo = new BacktestRunRepository(supabase)
    const run = await runRepo.getById(runId)
    if (!run) {
      return { success: false, error: { type: 'database', message: 'Backtest run not found.' } }
    }

    const report = BacktestReportBuilder.deserialize(run.report)
    if (!report) {
      return { success: false, error: { type: 'database', message: 'Failed to load report payload.' } }
    }

    const cleanName = run.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()

    if (format === 'json') {
      return {
        success: true,
        data: {
          filename: `backtest_${cleanName}_${run.id.substring(0, 8)}.json`,
          content: ExportEngine.toJSON(report),
          mimeType: 'application/json',
        },
      }
    } else if (format === 'csv') {
      const tradeRepo = new BacktestTradeRepository(supabase)
      const trades = await tradeRepo.getByRun(runId)
      return {
        success: true,
        data: {
          filename: `trades_${cleanName}_${run.id.substring(0, 8)}.csv`,
          content: ExportEngine.tradesToCSV(trades),
          mimeType: 'text/csv',
        },
      }
    } else {
      return {
        success: true,
        data: {
          filename: `summary_${cleanName}_${run.id.substring(0, 8)}.txt`,
          content: ExportEngine.toPDFText(report),
          mimeType: 'text/plain',
        },
      }
    }
  } catch (err) {
    return handleActionError<{ filename: string; content: string; mimeType: string }>(err)
  }
}
