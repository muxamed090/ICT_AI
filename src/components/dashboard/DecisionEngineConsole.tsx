"use client"

import React, { useState, useTransition } from 'react'
import { 
  Play, 
  Check, 
  X, 
  Loader2, 
  Save, 
  Info, 
  Brain, 
  DollarSign, 
  FileText 
} from 'lucide-react'
import { 
  UserSettings, 
  MarketSnapshot, 
  DecisionResult, 
  AiDecision,
  TradingSession,
  IctKillzone,
  MarketBias,
  FvgType
} from '@/types/database'
import { 
  runAiDecisionAction, 
  saveDecisionAndGenerateSignalAction 
} from '@/actions/decisionActions'

interface DecisionEngineConsoleProps {
  settings: UserSettings
  initialDecisions: AiDecision[]
}

const DECISION_BADGES: Record<string, string> = {
  ENTRY: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  WATCH: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
  WAIT: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  IGNORE: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
}

export default function DecisionEngineConsole({ 
  settings, 
  initialDecisions 
}: DecisionEngineConsoleProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'history'>('simulator')
  const [decisions, setDecisions] = useState<AiDecision[]>(initialDecisions)
  const [accountBalance, setAccountBalance] = useState<number>(100000)
  const [activeDrawdown, setActiveDrawdown] = useState<number>(0.0)
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null)
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSimulating, startSimulating] = useTransition()
  const [isSaving, startSaving] = useTransition()

  // Simulator Snapshot Form State
  const [snapshot, setSnapshot] = useState<MarketSnapshot>({
    pair: 'EURUSD',
    timeframe: '15m',
    session: 'london',
    killzone: 'london',
    trend: 'bullish',
    htf_bias: 'bullish',
    fvg_type: 'bisi',
    liquidity_sweep: 'low',
    volume: 'high',
    spread: 1.2,
    bos: true,
    choch: true,
    ote: true
  })

  const handleSimulate = () => {
    setFeedback(null)
    startSimulating(async () => {
      const result = await runAiDecisionAction(snapshot, accountBalance, activeDrawdown)
      if (result.success && result.data) {
        setDecisionResult(result.data)
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Simulation pipeline failed.' })
      }
    })
  }

  const handleCommitDecision = () => {
    if (!decisionResult) return
    setFeedback(null)
    startSaving(async () => {
      const result = await saveDecisionAndGenerateSignalAction(snapshot, decisionResult)
      if (result.success && result.data) {
        setDecisions([result.data.decision, ...decisions])
        setFeedback({ 
          type: 'success', 
          message: result.data.signalGenerated 
            ? 'AI Decision logged and Signal dispatched successfully!' 
            : 'AI Decision logged in historic journal successfully.' 
        })
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Failed to log decision.' })
      }
    })
  }

  const inputClass = "w-full text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/40 transition-all"
  const labelClass = "text-[9px] font-bold text-slate-500 uppercase tracking-widest"

  return (
    <div className="space-y-6">
      {/* Console Tab Selectors */}
      <div className="flex border-b border-white/[0.04] gap-6">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-xs font-bold transition-all ${
            activeTab === 'simulator' 
              ? 'border-b-2 border-blue-500 text-white' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Decision Simulator
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition-all ${
            activeTab === 'history' 
              ? 'border-b-2 border-blue-500 text-white' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Decision History Logs ({decisions.length})
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Grid: Parameter Simulator Configuration (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.03] pb-3">
                <Brain className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="text-xs font-bold text-white">Pipeline Context Parameters</h3>
                  <p className="text-[10px] text-slate-500">Configure market conditions and account data metrics.</p>
                </div>
              </div>

              {/* Account Parameters */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/[0.03]">
                <div className="space-y-1">
                  <label className={labelClass}>Account Balance (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input 
                      type="number" 
                      value={accountBalance} 
                      onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Active Daily Drawdown (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={activeDrawdown} 
                    onChange={(e) => setActiveDrawdown(parseFloat(e.target.value) || 0.0)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Market Parameters Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelClass}>Target Pair</label>
                  <select 
                    value={snapshot.pair} 
                    onChange={(e) => setSnapshot({ ...snapshot, pair: e.target.value })}
                    className={inputClass}
                  >
                    <option value="EURUSD">EURUSD</option>
                    <option value="GBPUSD">GBPUSD</option>
                    <option value="USDJPY">USDJPY</option>
                    <option value="XAUUSD">XAUUSD</option>
                    <option value="BTCUSD">BTCUSD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Timeframe</label>
                  <select 
                    value={snapshot.timeframe} 
                    onChange={(e) => setSnapshot({ ...snapshot, timeframe: e.target.value })}
                    className={inputClass}
                  >
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Current Spread (Pips)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={snapshot.spread} 
                    onChange={(e) => setSnapshot({ ...snapshot, spread: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Trading Session</label>
                  <select 
                    value={snapshot.session} 
                    onChange={(e) => setSnapshot({ ...snapshot, session: e.target.value as TradingSession })}
                    className={inputClass}
                  >
                    <option value="asian">Asian Session</option>
                    <option value="london">London Session</option>
                    <option value="new_york_am">NY Session AM</option>
                    <option value="new_york_pm">NY Session PM</option>
                    <option value="london_close">London Close</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Active Killzone</label>
                  <select 
                    value={snapshot.killzone} 
                    onChange={(e) => setSnapshot({ ...snapshot, killzone: e.target.value as IctKillzone })}
                    className={inputClass}
                  >
                    <option value="asia">Asia Killzone</option>
                    <option value="london">London Killzone</option>
                    <option value="new_york">New York Killzone</option>
                    <option value="none">None (Out of Zone)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Volume Depth</label>
                  <select 
                    value={snapshot.volume} 
                    onChange={(e) => setSnapshot({ ...snapshot, volume: e.target.value as 'high' | 'average' | 'low' })}
                    className={inputClass}
                  >
                    <option value="high">High</option>
                    <option value="average">Average</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>LTF Trend</label>
                  <select 
                    value={snapshot.trend} 
                    onChange={(e) => setSnapshot({ ...snapshot, trend: e.target.value as 'bullish' | 'bearish' | 'ranging' })}
                    className={inputClass}
                  >
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                    <option value="ranging">Ranging</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>HTF Bias</label>
                  <select 
                    value={snapshot.htf_bias} 
                    onChange={(e) => setSnapshot({ ...snapshot, htf_bias: e.target.value as MarketBias })}
                    className={inputClass}
                  >
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Fair Value Gap</label>
                  <select 
                    value={snapshot.fvg_type} 
                    onChange={(e) => setSnapshot({ ...snapshot, fvg_type: e.target.value as FvgType })}
                    className={inputClass}
                  >
                    <option value="bisi">BISI (Bullish FVG)</option>
                    <option value="sibi">SIBI (Bearish FVG)</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              {/* Struct/Retrace checklist switches */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSnapshot({ ...snapshot, bos: !snapshot.bos })}
                  className={`py-2 px-3 border text-[10px] font-bold rounded-lg transition-all ${
                    snapshot.bos 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                  }`}
                >
                  BOS {snapshot.bos ? '✓' : '✗'}
                </button>
                <button 
                  type="button"
                  onClick={() => setSnapshot({ ...snapshot, choch: !snapshot.choch })}
                  className={`py-2 px-3 border text-[10px] font-bold rounded-lg transition-all ${
                    snapshot.choch 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                  }`}
                >
                  CHoCH {snapshot.choch ? '✓' : '✗'}
                </button>
                <button 
                  type="button"
                  onClick={() => setSnapshot({ ...snapshot, ote: !snapshot.ote })}
                  className={`py-2 px-3 border text-[10px] font-bold rounded-lg transition-all ${
                    snapshot.ote 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                  }`}
                >
                  OTE Retrace {snapshot.ote ? '✓' : '✗'}
                </button>
              </div>

              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-1.5 py-3 mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40"
              >
                {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Evaluate Decision Pipeline
              </button>
            </div>
          </div>

          {/* Right Grid: Engine Outputs & Trace Console (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {feedback && (
              <div className={`p-3 rounded-lg border text-xs font-mono ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {feedback.message}
              </div>
            )}

            {!decisionResult ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-white/[0.03] rounded-xl bg-slate-950/10 min-h-[420px]">
                <Info className="h-8 w-8 text-slate-600 mb-2" />
                <h4 className="text-xs font-bold text-white">Awaiting Evaluation</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Configure context parameters and click evaluate to run risk, rules, cost engines calculations.</p>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-950/15 border border-white/[0.05] p-5 rounded-xl">
                
                {/* Big Ambient Decision Header */}
                <div className={`border border-white/[0.06] rounded-xl p-4 flex items-center justify-between transition-all ${DECISION_BADGES[decisionResult.decision]}`}>
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">AI Recommendation</span>
                    <h2 className="text-xl font-black uppercase tracking-wider">{decisionResult.decision}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold font-mono block">Confluence: {decisionResult.confluenceScore.toFixed(1)}/10.0</span>
                    <span className="text-[9px] text-slate-400 block font-mono">Bias: {decisionResult.marketBias}</span>
                  </div>
                </div>

                {/* Risk Checklist Indicators */}
                <div className="space-y-2">
                  <p className={labelClass}>Risk Validation Pipeline</p>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/[0.02]">
                      <span className="text-slate-400">Spread Limitation check</span>
                      {decisionResult.riskEvaluation.isSpreadOk ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">Pass <Check className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">Blocked <X className="h-3.5 w-3.5" /></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/[0.02]">
                      <span className="text-slate-400">High-Impact News filter</span>
                      {decisionResult.riskEvaluation.isNewsSafe ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">Safe <Check className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1" title={decisionResult.riskEvaluation.collidingNewsEvent ?? ''}>Impact lock <X className="h-3.5 w-3.5" /></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/[0.02]">
                      <span className="text-slate-400">Daily Drawdown limit</span>
                      {decisionResult.riskEvaluation.isDrawdownOk ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">Pass <Check className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">Drawdown lock <X className="h-3.5 w-3.5" /></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sizing & Costs details */}
                {decisionResult.positionCalculation && (
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/[0.03]">
                    <div className="bg-white/[0.01] p-3 rounded-lg border border-white/[0.03] space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Lot Sizing</span>
                      <h4 className="text-base font-black text-white">{decisionResult.positionCalculation.lotSize} Lots</h4>
                      <span className="text-[8px] font-mono text-slate-600 block">Risk: ${decisionResult.positionCalculation.riskAmountUsd} ({settings.risk_profile})</span>
                    </div>
                    <div className="bg-white/[0.01] p-3 rounded-lg border border-white/[0.03] space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Execution Costs</span>
                      <h4 className="text-base font-black text-white">${decisionResult.tradingCost.totalCost}</h4>
                      <span className="text-[8px] font-mono text-slate-600 block">Spread: ${decisionResult.tradingCost.spreadCost} | Comm: ${decisionResult.tradingCost.commission}</span>
                    </div>
                  </div>
                )}

                {/* Targets breakdown */}
                {decisionResult.positionCalculation && (
                  <div className="bg-white/[0.01] p-3 rounded-lg border border-white/[0.03] space-y-2">
                    <p className={labelClass}>Position Target Levels</p>
                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                      <div className="bg-slate-950/20 p-1.5 rounded border border-white/[0.02]">
                        <span className="text-slate-500 block">ENTRY</span>
                        <span className="text-white font-bold">{decisionResult.positionCalculation.entryPrice}</span>
                      </div>
                      <div className="bg-rose-500/5 p-1.5 rounded border border-rose-500/10">
                        <span className="text-rose-500/70 block">STOP LOSS</span>
                        <span className="text-rose-400 font-bold">{decisionResult.positionCalculation.stopLossPrice}</span>
                      </div>
                      <div className="bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                        <span className="text-emerald-500/70 block">TP1 (1:2)</span>
                        <span className="text-emerald-400 font-bold">{decisionResult.positionCalculation.tp1}</span>
                      </div>
                      <div className="bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                        <span className="text-emerald-500/70 block">TP2 (1:3)</span>
                        <span className="text-emerald-400 font-bold">{decisionResult.positionCalculation.tp2}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanatory traces logs */}
                <div className="space-y-1.5">
                  <p className={labelClass}>Pipeline Logs Traces</p>
                  <div className="max-h-[120px] overflow-y-auto font-mono text-[9px] text-slate-400 bg-[#070c16] rounded-lg border border-white/[0.04] p-3 space-y-1.5">
                    {decisionResult.decisionTrace.map((log, index) => (
                      <div key={index} className="flex gap-1.5 items-start">
                        <span className="text-slate-600 select-none">&gt;</span>
                        <span className="leading-relaxed">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commit Action Button */}
                <button
                  onClick={handleCommitDecision}
                  disabled={isSaving || isSimulating}
                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {decisionResult.decision === 'ENTRY' ? 'Commit Decision & Dispatch Signal' : 'Commit Decision to Logs'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Logs Tab Table View */
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.03] pb-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-xs font-bold text-white">AI Decision Logging History</h3>
              <p className="text-[10px] text-slate-500">Historical traces of all computed recommendations for analytics and model feedback loop audits.</p>
            </div>
          </div>

          {decisions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No historical AI decision records logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold text-[8px]">
                    <th className="py-2.5 px-3">Date/Time</th>
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Confluence</th>
                    <th className="py-2.5 px-3">Bias</th>
                    <th className="py-2.5 px-3">Decision</th>
                    <th className="py-2.5 px-3">Cost Est.</th>
                    <th className="py-2.5 px-3">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {decisions.map((dec) => {
                    const result: Record<string, unknown> = dec.decision_result
                    const snap: Record<string, unknown> = dec.snapshot

                    // Extract typed values from unknown JSONB payloads
                    const pair = typeof snap?.pair === 'string' ? snap.pair : 'N/A'
                    const confluenceScore = typeof result?.confluenceScore === 'number'
                      ? result.confluenceScore.toFixed(1)
                      : '0.0'
                    const marketBias = typeof result?.marketBias === 'string' ? result.marketBias : 'neutral'
                    const decision = typeof result?.decision === 'string' ? result.decision : 'IGNORE'
                    const tradingCostObj = result?.tradingCost && typeof result.tradingCost === 'object'
                      ? result.tradingCost as Record<string, unknown>
                      : null
                    const totalCost = typeof tradingCostObj?.totalCost === 'number'
                      ? tradingCostObj.totalCost.toFixed(2)
                      : '0.00'

                    return (
                      <tr key={dec.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {new Date(dec.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {pair}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {confluenceScore}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-300">
                          {marketBias}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            decision === 'ENTRY' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : decision === 'WATCH'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : decision === 'WAIT'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          ${totalCost}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[8px]">
                          {dec.model_version}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
