"use client"

import React, { useState, useTransition } from 'react'
import {
  Play,
  Loader2,
  TrendingUp,
  TrendingDown,
  Layers,
  Download,
  Trash2,
  Sliders,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import {
  BacktestRun,
  BacktestReport,
  BacktestTrade,
  BacktestConfig,
  StrategyComparisonResult,
  MlMode,
} from '@/types/database'
import {
  runBacktestAction,
  getBacktestReportAction,
  getBacktestTradesAction,
  deleteBacktestRunAction,
  compareBacktestRunsAction,
  exportBacktestRunAction,
} from '@/actions/backtestActions'

interface BacktestConsoleProps {
  initialRuns: Omit<BacktestRun, 'report'>[]
  completedTradeCount: number
}

export default function BacktestConsole({
  initialRuns,
  completedTradeCount,
}: BacktestConsoleProps) {
  const [activeTab, setActiveTab] = useState<
    'configure' | 'performance' | 'periods' | 'dimensions' | 'replay' | 'workspace'
  >('configure')
  const [runs, setRuns] = useState<Omit<BacktestRun, 'report'>[]>(initialRuns)
  const [currentReport, setCurrentReport] = useState<BacktestReport | null>(null)
  const [currentTrades, setCurrentTrades] = useState<BacktestTrade[]>([])
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([])
  const [comparisonResult, setComparisonResult] = useState<StrategyComparisonResult | null>(null)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isRunning, startRunning] = useTransition()
  const [isLoadingReport, startLoadingReport] = useTransition()
  const [isComparing, startComparing] = useTransition()

  // Form config state
  const [config, setConfig] = useState<BacktestConfig>({
    name: 'Standard Strategy Backtest',
    description: 'Historical simulation across all traded pairs',
    mlMode: 'hybrid',
    dateFrom: '2024-01-01',
    dateTo: new Date().toISOString().split('T')[0],
    pairFilter: [],
    sessionFilter: [],
    initialEquity: 100000,
    minSampleSize: 20,
  })

  // Tab 3 period sub-tab state
  const [periodSubTab, setPeriodSubTab] = useState<'monthly' | 'weekly' | 'daily'>('monthly')
  // Tab 4 dimension sub-tab state
  const [dimensionSubTab, setDimensionSubTab] = useState<'pair' | 'session' | 'setup'>('pair')
  // Tab 6 workspace sub-tab state
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'history' | 'compare' | 'export' | 'advanced'>('history')

  const handleRunBacktest = () => {
    setFeedback(null)
    startRunning(async () => {
      const res = await runBacktestAction(config)
      if (res.success && res.data) {
        setCurrentReport(res.data)
        const summaryItem: Omit<BacktestRun, 'report'> = {
          id: res.data.runId,
          user_id: '',
          name: res.data.config.name,
          description: res.data.config.description || null,
          ml_mode: res.data.config.mlMode,
          model_version: 'ICT-ML-v1',
          rules_engine_version: res.data.engineVersions.rulesEngine,
          decision_engine_version: res.data.engineVersions.decisionEngine,
          ml_engine_version: res.data.engineVersions.mlEngine,
          date_from: res.data.config.dateFrom,
          date_to: res.data.config.dateTo,
          pair_filter: res.data.config.pairFilter,
          session_filter: res.data.config.sessionFilter,
          total_trades: res.data.totalTrades,
          winning_trades: res.data.winningTrades,
          losing_trades: res.data.losingTrades,
          breakeven_trades: res.data.breakevenTrades,
          win_rate: res.data.winRate,
          loss_rate: res.data.lossRate,
          profit_factor: res.data.profitFactor,
          expectancy: res.data.expectancy,
          avg_rr: res.data.avgRR,
          net_pnl: res.data.netPnl,
          gross_profit: res.data.grossProfit,
          gross_loss: res.data.grossLoss,
          max_drawdown: res.data.maxDrawdown,
          max_drawdown_pct: res.data.maxDrawdownPct,
          sharpe_ratio: res.data.sharpeRatio,
          status: 'completed',
          created_at: new Date().toISOString(),
        }
        setRuns([summaryItem, ...runs])

        // Fetch trade replay
        const tradesRes = await getBacktestTradesAction(res.data.runId)
        if (tradesRes.success && tradesRes.data) {
          setCurrentTrades(tradesRes.data)
        }

        setActiveTab('performance')
        setFeedback({ type: 'success', message: 'Backtest simulation executed successfully!' })
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Backtest failed.' })
      }
    })
  }

  const handleSelectRun = (runId: string) => {
    setFeedback(null)
    startLoadingReport(async () => {
      const [repRes, tradesRes] = await Promise.all([
        getBacktestReportAction(runId),
        getBacktestTradesAction(runId),
      ])

      if (repRes.success && repRes.data) {
        setCurrentReport(repRes.data)
        if (tradesRes.success && tradesRes.data) setCurrentTrades(tradesRes.data)
        setActiveTab('performance')
      } else {
        setFeedback({ type: 'error', message: repRes.error?.message || 'Failed to load report.' })
      }
    })
  }

  const handleDeleteRun = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await deleteBacktestRunAction(runId)
    if (res.success) {
      setRuns(runs.filter((r) => r.id !== runId))
      if (currentReport?.runId === runId) setCurrentReport(null)
      setSelectedRunIds(selectedRunIds.filter((id) => id !== runId))
    }
  }

  const handleToggleCompare = (runId: string) => {
    if (selectedRunIds.includes(runId)) {
      setSelectedRunIds(selectedRunIds.filter((id) => id !== runId))
    } else {
      if (selectedRunIds.length >= 5) return
      setSelectedRunIds([...selectedRunIds, runId])
    }
  }

  const handleRunComparison = () => {
    if (selectedRunIds.length < 2) return
    startComparing(async () => {
      const res = await compareBacktestRunsAction({ runIds: selectedRunIds })
      if (res.success && res.data) {
        setComparisonResult(res.data)
        setWorkspaceSubTab('compare')
      }
    })
  }

  const handleExport = async (runId: string, format: 'json' | 'csv' | 'pdf') => {
    const res = await exportBacktestRunAction(runId, format)
    if (res.success && res.data) {
      const blob = new Blob([res.data.content], { type: res.data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const labelClass = 'text-[9px] font-bold text-slate-500 uppercase tracking-widest'

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/[0.04] gap-6 overflow-x-auto">
        {(
          [
            ['configure', 'Configure & Run'],
            ['performance', `Performance ${currentReport ? '✓' : ''}`],
            ['periods', 'Period Analysis'],
            ['dimensions', 'Dimensional Stats'],
            ['replay', `Trade Replay (${currentTrades.length})`],
            ['workspace', `Workspace & History (${runs.length})`],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab !== 'configure' && tab !== 'workspace' && !currentReport}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap disabled:opacity-40 ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tab 1: Configure & Run */}
      {activeTab === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
              <Sliders className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-xs font-bold text-white">Backtest Simulation Parameters</h3>
                <p className="text-[10px] text-slate-500">
                  Configure simulation scopes and model execution modes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Strategy Run Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full mt-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className={labelClass}>ML Execution Mode</label>
                <select
                  value={config.mlMode}
                  onChange={(e) => setConfig({ ...config, mlMode: e.target.value as MlMode })}
                  className="w-full mt-1 bg-slate-900 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="rules_only">Rules Only (Pure ICT Rules)</option>
                  <option value="hybrid">Hybrid (ICT Rules + ML Calibration)</option>
                  <option value="ml_priority">ML Priority (ML High-Confidence Override)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Start Date (From)</label>
                <input
                  type="date"
                  value={config.dateFrom}
                  onChange={(e) => setConfig({ ...config, dateFrom: e.target.value })}
                  className="w-full mt-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className={labelClass}>End Date (To)</label>
                <input
                  type="date"
                  value={config.dateTo}
                  onChange={(e) => setConfig({ ...config, dateTo: e.target.value })}
                  className="w-full mt-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className={labelClass}>Initial Portfolio Capital ($)</label>
                <input
                  type="number"
                  value={config.initialEquity}
                  onChange={(e) => setConfig({ ...config, initialEquity: Number(e.target.value) })}
                  className="w-full mt-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className={labelClass}>Minimum Required Sample Trades</label>
                <input
                  type="number"
                  value={config.minSampleSize}
                  onChange={(e) => setConfig({ ...config, minSampleSize: Number(e.target.value) })}
                  className="w-full mt-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isRunning || completedTradeCount < config.minSampleSize}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Running Simulation Pipeline...' : 'Execute Backtest Simulation'}
            </button>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white">Historical Dataset Readiness</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs text-slate-400">Completed Journal Trades</span>
                  <span className="text-sm font-bold text-white font-mono">{completedTradeCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs text-slate-400">Sample Guard Requirement</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{config.minSampleSize}</span>
                </div>
                {completedTradeCount < config.minSampleSize && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <ShieldAlert className="h-3.5 w-3.5" /> Insufficient Data Guard
                    </div>
                    <p>Log at least {config.minSampleSize - completedTradeCount} more completed trades in your Trade Journal to run simulation analytics.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Performance Dashboard */}
      {activeTab === 'performance' && currentReport && (
        <div className="space-y-6">
          {/* Headline Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Total Trades', val: currentReport.totalTrades, sub: `${currentReport.winningTrades}W / ${currentReport.losingTrades}L` },
              { label: 'Win Rate', val: `${currentReport.winRate.toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'Profit Factor', val: currentReport.profitFactor.toFixed(2), color: currentReport.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Net PnL', val: `$${currentReport.netPnl.toFixed(0)}`, color: currentReport.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Expectancy', val: `$${currentReport.expectancy.toFixed(2)}`, sub: 'per trade' },
              { label: 'Average R:R', val: `1:${currentReport.avgRR.toFixed(2)}` },
              { label: 'Max Drawdown', val: `${currentReport.maxDrawdownPct.toFixed(1)}%`, color: 'text-rose-400', sub: `$${currentReport.maxDrawdown}` },
              { label: 'Sharpe Ratio', val: currentReport.sharpeRatio !== null ? currentReport.sharpeRatio.toFixed(2) : 'N/A' },
            ].map((item, idx) => (
              <div key={idx} className="glass-panel p-3 rounded-xl border border-white/[0.04] bg-slate-950/20 space-y-1">
                <span className={labelClass}>{item.label}</span>
                <p className={`text-base font-black ${item.color || 'text-white'}`}>{item.val}</p>
                {item.sub && <p className="text-[9px] text-slate-500 font-mono">{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* Equity & Drawdown SVG Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> Portfolio Equity Growth Trajectory
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Capital: ${currentReport.config.initialEquity.toLocaleString()} → ${currentReport.equityCurve[currentReport.equityCurve.length - 1]?.equity.toLocaleString()}</span>
              </div>
              <div className="h-48 w-full bg-slate-900/40 rounded-lg p-2 border border-white/[0.03] flex items-end">
                {/* SVG Line Chart rendering */}
                <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {(() => {
                    const minEq = Math.min(...currentReport.equityCurve.map((e) => e.equity)) * 0.98
                    const maxEq = Math.max(...currentReport.equityCurve.map((e) => e.equity)) * 1.02
                    const range = maxEq - minEq || 1
                    const pts = currentReport.equityCurve.map((pt, idx) => {
                      const x = (idx / (currentReport.equityCurve.length - 1 || 1)) * 500
                      const y = 150 - ((pt.equity - minEq) / range) * 150
                      return `${x},${y}`
                    }).join(' ')
                    return <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pts} />
                  })()}
                </svg>
              </div>
            </div>

            <div className="lg:col-span-4 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-400" /> Drawdown Risk Profile (%)
                </h3>
              </div>
              <div className="h-48 w-full bg-slate-900/40 rounded-lg p-2 border border-white/[0.03] flex items-end">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 300 150" preserveAspectRatio="none">
                  {(() => {
                    const maxDD = Math.max(...currentReport.drawdownCurve.map((d) => d.drawdownPct), 5)
                    const pts = currentReport.drawdownCurve.map((pt, idx) => {
                      const x = (idx / (currentReport.drawdownCurve.length - 1 || 1)) * 300
                      const y = (pt.drawdownPct / maxDD) * 140
                      return `${x},${y}`
                    }).join(' ')
                    return (
                      <polygon fill="rgba(244,63,94,0.25)" stroke="#f43f5e" strokeWidth="1.5" points={`0,0 ${pts} 300,0`} />
                    )
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Period Analysis */}
      {activeTab === 'periods' && currentReport && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h3 className="text-xs font-bold text-white">Periodic Strategy Performance</h3>
            <div className="flex gap-2 text-[10px] font-bold">
              {(['monthly', 'weekly', 'daily'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodSubTab(p)}
                  className={`px-3 py-1 rounded capitalize ${periodSubTab === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold">
                  <th className="py-2 px-3">Period</th>
                  <th className="py-2 px-3">Trades</th>
                  <th className="py-2 px-3">Wins</th>
                  <th className="py-2 px-3">Losses</th>
                  <th className="py-2 px-3">Win Rate</th>
                  <th className="py-2 px-3">Profit Factor</th>
                  <th className="py-2 px-3">Net PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {(periodSubTab === 'monthly'
                  ? currentReport.monthlyPerformance
                  : periodSubTab === 'weekly'
                  ? currentReport.weeklyPerformance
                  : currentReport.dailyPerformance
                ).map((row) => (
                  <tr key={row.period} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{row.period}</td>
                    <td className="py-2.5 px-3 font-mono">{row.trades}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">{row.wins}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-mono">{row.losses}</td>
                    <td className="py-2.5 px-3 font-mono">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 font-mono font-bold ${row.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${row.netPnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Dimensional Stats */}
      {activeTab === 'dimensions' && currentReport && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h3 className="text-xs font-bold text-white">Dimensional Strategy Breakdown</h3>
            <div className="flex gap-2 text-[10px] font-bold">
              {(['pair', 'session', 'setup'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDimensionSubTab(d)}
                  className={`px-3 py-1 rounded capitalize ${dimensionSubTab === d ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold">
                  <th className="py-2 px-3">Dimension</th>
                  <th className="py-2 px-3">Trades</th>
                  <th className="py-2 px-3">Win Rate</th>
                  <th className="py-2 px-3">Avg R:R</th>
                  <th className="py-2 px-3">Expectancy</th>
                  <th className="py-2 px-3">Net PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {dimensionSubTab === 'pair'
                  ? currentReport.pairStats.map((s) => (
                      <tr key={s.pair} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-3 font-bold text-white">{s.pair}</td>
                        <td className="py-2.5 px-3 font-mono">{s.trades}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{s.winRate.toFixed(1)}%</td>
                        <td className="py-2.5 px-3 font-mono">1:{s.avgRR.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">${s.expectancy.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${s.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${s.netPnl.toFixed(2)}</td>
                      </tr>
                    ))
                  : dimensionSubTab === 'session'
                  ? currentReport.sessionStats.map((s) => (
                      <tr key={s.session} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-3 font-bold text-white capitalize">{s.session.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 font-mono">{s.trades}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{s.winRate.toFixed(1)}%</td>
                        <td className="py-2.5 px-3 font-mono">1:{s.avgRR.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">P.F: {s.profitFactor.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${s.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${s.netPnl.toFixed(2)}</td>
                      </tr>
                    ))
                  : currentReport.ictSetupStats.map((s) => (
                      <tr key={s.setupType} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-3 font-bold text-white">{s.setupType}</td>
                        <td className="py-2.5 px-3 font-mono">{s.trades}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{s.winRate.toFixed(1)}%</td>
                        <td className="py-2.5 px-3 font-mono">1:{s.avgRR.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">-</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${s.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${s.netPnl.toFixed(2)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Trade Replay */}
      {activeTab === 'replay' && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-white">Historical Trade Replay Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Pair</th>
                  <th className="py-2 px-3">Dir</th>
                  <th className="py-2 px-3">Result</th>
                  <th className="py-2 px-3">PnL</th>
                  <th className="py-2 px-3">ICT Score</th>
                  <th className="py-2 px-3">ML Score</th>
                  <th className="py-2 px-3">Running Eq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {currentTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{t.trade_index}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(t.traded_at).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{t.pair}</td>
                    <td className={`py-2.5 px-3 font-bold uppercase ${t.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.direction}</td>
                    <td className={`py-2.5 px-3 font-bold capitalize ${t.result === 'win' ? 'text-emerald-400' : t.result === 'loss' ? 'text-rose-400' : 'text-slate-400'}`}>{t.result}</td>
                    <td className={`py-2.5 px-3 font-mono font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.pnl.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono">{t.ict_score !== null ? t.ict_score.toFixed(1) : '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-400">{t.ml_score !== null ? t.ml_score.toFixed(1) : '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-white">${t.running_equity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Unified Workspace (History, Compare, Export, Advanced) */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          <div className="flex border-b border-white/[0.04] gap-4">
            {(['history', 'compare', 'export', 'advanced'] as const).map((ws) => (
              <button
                key={ws}
                onClick={() => setWorkspaceSubTab(ws)}
                className={`pb-2 text-xs font-bold capitalize ${workspaceSubTab === ws ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {ws === 'history' ? `History Runs (${runs.length})` : ws === 'compare' ? `Multi-Strategy Compare (${selectedRunIds.length})` : ws === 'export' ? 'Report Export Hub' : 'Monte Carlo & Walk-Forward'}
              </button>
            ))}
          </div>

          {workspaceSubTab === 'history' && (
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">Historical Backtest Runs Workspace</h3>
                {selectedRunIds.length >= 2 && (
                  <button
                    onClick={handleRunComparison}
                    disabled={isComparing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    {isComparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                    Compare Selected ({selectedRunIds.length})
                  </button>
                )}
              </div>

              <div className={`space-y-3 ${isLoadingReport ? 'opacity-60 pointer-events-none' : ''}`}>
                {runs.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRun(r.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${currentReport?.runId === r.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRunIds.includes(r.id)}
                        onChange={() => handleToggleCompare(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{r.name}</h4>
                          <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{r.ml_mode}</span>
                          <span className="text-[8px] font-mono text-slate-400">{r.rules_engine_version}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Ran: {new Date(r.created_at).toLocaleString()} · Trades: {r.total_trades}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400 font-mono">{r.win_rate.toFixed(1)}% WR</p>
                        <p className={`text-[10px] font-mono ${r.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${r.net_pnl.toFixed(0)} PnL</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteRun(r.id, e)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workspaceSubTab === 'compare' && (
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white">Multi-Strategy Comparative Analytics</h3>
              {comparisonResult ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold">
                        <th className="py-2 px-3">Strategy Name</th>
                        <th className="py-2 px-3">ML Mode</th>
                        <th className="py-2 px-3">Trades</th>
                        <th className="py-2 px-3">Win Rate</th>
                        <th className="py-2 px-3">Profit Factor</th>
                        <th className="py-2 px-3">Sharpe</th>
                        <th className="py-2 px-3">Max DD (%)</th>
                        <th className="py-2 px-3">Net PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {comparisonResult.items.map((item) => (
                        <tr key={item.runId} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 font-bold text-white">{item.name}</td>
                          <td className="py-2.5 px-3 font-mono uppercase text-blue-400">{item.mlMode}</td>
                          <td className="py-2.5 px-3 font-mono">{item.totalTrades}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{item.winRate.toFixed(1)}%</td>
                          <td className="py-2.5 px-3 font-mono">{item.profitFactor.toFixed(2)}</td>
                          <td className="py-2.5 px-3 font-mono">{item.sharpeRatio !== null ? item.sharpeRatio.toFixed(2) : '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-rose-400">{item.maxDrawdownPct.toFixed(1)}%</td>
                          <td className={`py-2.5 px-3 font-mono font-bold ${item.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${item.netPnl.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">Select 2 to 5 runs in the History tab and click &quot;Compare Selected&quot;.</div>
              )}
            </div>
          )}

          {workspaceSubTab === 'export' && currentReport && (
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white">Export Report Artifacts</h3>
              <p className="text-[10px] text-slate-500">Download active backtest report artifacts for external BI tools, Excel analysis, or archival.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { format: 'json' as const, label: 'JSON Dataset', desc: 'Complete raw report payload' },
                  { format: 'csv' as const, label: 'CSV Trade Stream', desc: 'Individual trade log for Excel/PowerBI' },
                  { format: 'pdf' as const, label: 'PDF Summary Text', desc: 'Printable executive summary' },
                ].map((item) => (
                  <button
                    key={item.format}
                    onClick={() => handleExport(currentReport.runId, item.format)}
                    className="flex flex-col items-start p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-left transition-all"
                  >
                    <Download className="h-5 w-5 text-blue-400 mb-2" />
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {workspaceSubTab === 'advanced' && currentReport && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Monte Carlo Box */}
              <div className="lg:col-span-6 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Monte Carlo Risk Analysis (500 Runs)</h4>
                    <p className="text-[9px] text-slate-500">Resampled trade permutations testing drawdown boundaries.</p>
                  </div>
                </div>

                {currentReport.monteCarlo && (
                  <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block text-[8px] uppercase">Worst DD Pct</span>
                      <span className="text-rose-400 font-bold">{currentReport.monteCarlo.worstDrawdownPct.toFixed(1)}%</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block text-[8px] uppercase">Prob of Profit</span>
                      <span className="text-emerald-400 font-bold">{currentReport.monteCarlo.probabilityOfProfit.toFixed(1)}%</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block text-[8px] uppercase">Median Return</span>
                      <span className="text-white font-bold">${currentReport.monteCarlo.medianReturn.toFixed(2)}</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block text-[8px] uppercase">Average Return</span>
                      <span className="text-white font-bold">${currentReport.monteCarlo.averageReturn.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Walk Forward Box */}
              <div className="lg:col-span-6 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Walk-Forward Validation Windows</h4>
                    <p className="text-[9px] text-slate-500">In-sample vs out-of-sample robustness verification.</p>
                  </div>
                </div>

                {currentReport.walkForward && (
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                      <span className="text-slate-400">Robustness Rating</span>
                      <span className="font-bold font-mono text-cyan-400">{currentReport.walkForward.robustnessScore.toFixed(1)} / 100</span>
                    </div>
                    <div className="space-y-1">
                      {currentReport.walkForward.windows.map((w) => (
                        <div key={w.windowIndex} className="flex justify-between items-center text-[9px] font-mono p-1.5 rounded bg-white/[0.01]">
                          <span className="text-slate-400">Win {w.windowIndex}: {w.testFrom}</span>
                          <span className="text-white">IS: {w.inSampleWinRate.toFixed(0)}% → OOS: {w.outOfSampleWinRate.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
