"use client"

import React, { useState, useTransition } from 'react'
import { 
  Sliders, 
  Play, 
  Check, 
  X, 
  RefreshCw, 
  Save, 
  Loader2, 
  Cpu, 
  Zap, 
  ShieldAlert,
  Info
} from 'lucide-react'
import { 
  IctRule, 
  UserSettings, 
  MarketSnapshot, 
  EngineResult,
  TradingSession,
  IctKillzone,
  MarketBias,
  FvgType
} from '@/types/database'
import { 
  updateRuleAction, 
  resetRulesToDefaultsAction, 
  simulateConfluenceAction, 
  saveSimulatedAnalysisAction,
  generateSignalFromSimulationAction
} from '@/actions/rulesActions'

interface RulesEnginePanelProps {
  rules: IctRule[]
  settings: UserSettings
}

const CATEGORY_BADGES: Record<string, string> = {
  structure: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  entry: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  liquidity: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  timing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trend: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  risk: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const RECOMMENDATION_BADGES: Record<string, string> = {
  ENTRY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 ring-1 ring-emerald-500/20',
  WATCH: 'bg-amber-500/10 text-amber-400 border-amber-500/35 ring-1 ring-amber-500/20',
  WAIT: 'bg-rose-500/10 text-rose-400 border-rose-500/35 ring-1 ring-rose-500/20',
}

export default function RulesEnginePanel({ rules: initialRules, settings }: RulesEnginePanelProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'simulator'>('config')
  
  // Tab 1: Configuration States
  const [rules, setRules] = useState<IctRule[]>(initialRules)
  const [isSaving, startSaving] = useTransition()
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Tab 2: Simulator States
  const [snapshot, setSnapshot] = useState<MarketSnapshot>({
    pair: 'EURUSD',
    timeframe: '15m',
    session: 'london',
    killzone: 'london',
    trend: 'bullish',
    bos: true,
    choch: true,
    fvg_type: 'bisi',
    ote: true,
    liquidity_sweep: 'low',
    htf_bias: 'bullish',
    volume: 'high',
    spread: 1.2
  })
  
  const [simulationResult, setSimulationResult] = useState<EngineResult | null>(null)
  const [isSimulating, startSimulating] = useTransition()
  const [simFeedback, setSimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const [loggedAnalysisId, setLoggedAnalysisId] = useState<string | null>(null)
  const [isLogging, startLogging] = useTransition()
  const [isGeneratingSignal, startGeneratingSignal] = useTransition()

  // --- Tab 1: Rules Config Handlers ---
  const handleToggleRule = (index: number) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    setRules(updated)
  }

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], weight: val }
    setRules(updated)
  }

  const handleSaveConfig = () => {
    setConfigFeedback(null)
    startSaving(async () => {
      try {
        let allSuccess = true
        for (const rule of rules) {
          const result = await updateRuleAction(rule.id, {
            weight: Number(rule.weight),
            enabled: rule.enabled,
            conditions: rule.conditions
          })
          if (!result.success) {
            allSuccess = false
            setConfigFeedback({ type: 'error', message: result.error?.message ?? 'Failed to update rules.' })
            break
          }
        }
        if (allSuccess) {
          setConfigFeedback({ type: 'success', message: 'All rules configuration saved successfully.' })
        }
      } catch {
        setConfigFeedback({ type: 'error', message: 'An unexpected error occurred while saving.' })
      }
    })
  }

  const handleResetDefaults = () => {
    setConfigFeedback(null)
    startSaving(async () => {
      const result = await resetRulesToDefaultsAction()
      if (result.success && result.data) {
        setRules(result.data)
        setConfigFeedback({ type: 'success', message: 'Rules reset to standard system defaults.' })
      } else {
        setConfigFeedback({ type: 'error', message: result.error?.message ?? 'Failed to reset rules.' })
      }
    })
  }

  // --- Tab 2: Simulator Handlers ---
  const handleSimulate = () => {
    setSimFeedback(null)
    setLoggedAnalysisId(null)
    startSimulating(async () => {
      const result = await simulateConfluenceAction(snapshot)
      if (result.success && result.data) {
        setSimulationResult(result.data)
      } else {
        setSimFeedback({ type: 'error', message: result.error?.message ?? 'Simulation execution failed.' })
      }
    })
  }

  const handleLogAnalysis = () => {
    setSimFeedback(null)
    startLogging(async () => {
      const result = await saveSimulatedAnalysisAction(snapshot)
      if (result.success && result.data) {
        setLoggedAnalysisId(result.data.id)
        setSimFeedback({ type: 'success', message: 'Simulated confluence successfully logged in AI Analysis journal!' })
      } else {
        setSimFeedback({ type: 'error', message: result.error?.message ?? 'Failed to save analysis.' })
      }
    })
  }

  const handleGenerateSignal = () => {
    if (!loggedAnalysisId) return
    setSimFeedback(null)
    startGeneratingSignal(async () => {
      const result = await generateSignalFromSimulationAction(loggedAnalysisId)
      if (result.success && result.data) {
        setSimFeedback({ type: 'success', message: `Trade Signal generated successfully! Signal entry price: ${result.data.entry}` })
      } else {
        setSimFeedback({ type: 'error', message: result.error?.message ?? 'Failed to generate signal.' })
      }
    })
  }

  // Common styling tokens
  const inputClass = "w-full text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/45 transition-all"
  const labelClass = "text-[9px] font-bold text-slate-500 uppercase tracking-widest"

  return (
    <div className="space-y-6">
      {/* Tab Navigation Menu */}
      <div className="flex border-b border-white/[0.04] gap-6">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'config' 
              ? 'text-blue-400' 
              : 'text-slate-500 hover:text-white'
          }`}
        >
          <Sliders className="h-4.5 w-4.5" />
          Rules Configuration
          {activeTab === 'config' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'simulator' 
              ? 'text-blue-400' 
              : 'text-slate-500 hover:text-white'
          }`}
        >
          <Play className="h-4.5 w-4.5" />
          Confluence Simulator
          {activeTab === 'simulator' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
      </div>

      {/* --- TAB 1: RULES CONFIGURATION PANEL --- */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">ICT Weights & State Configurator</h3>
              <p className="text-[10px] text-slate-500">Configure weighting impacts and switch state toggles. The Simulator reads these weights dynamically.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDefaults}
                disabled={isSaving}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 border border-white/[0.08] hover:bg-white/[0.03] text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                Reset Defaults
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-blue-600/20 border border-blue-500/35 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all cursor-pointer disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </div>
          </div>

          {configFeedback && (
            <div className={`p-3.5 rounded-lg border text-xs font-mono ${
              configFeedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {configFeedback.message}
            </div>
          )}

          {/* Rules Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule, index) => {
              const badge = CATEGORY_BADGES[rule.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              return (
                <div 
                  key={rule.id} 
                  className={`glass-panel border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 ${
                    rule.enabled 
                      ? 'border-white/[0.05] bg-slate-950/15' 
                      : 'border-white/[0.02] bg-slate-950/5 opacity-55'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded border ${badge}`}>
                        {rule.category}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">v{rule.version}</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">{rule.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed min-h-[40px]">{rule.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.03] space-y-4">
                    {/* Weight Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500">Weight Multiplier</span>
                        <span className="text-blue-400 font-mono">{Number(rule.weight).toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="5.0" 
                        step="0.5" 
                        value={rule.weight} 
                        onChange={(e) => handleWeightChange(index, parseFloat(e.target.value))}
                        disabled={!rule.enabled}
                        className="w-full h-1 bg-white/[0.05] rounded-lg appearance-none cursor-pointer focus:outline-none accent-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Switch/Toggle Container */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Status</span>
                      <button
                        onClick={() => handleToggleRule(index)}
                        className={`relative inline-flex h-5.5 w-10.5 items-center rounded-full transition-colors cursor-pointer ${
                          rule.enabled ? 'bg-blue-600' : 'bg-white/[0.06] border border-white/[0.08]'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-5.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: CONFLUENCE SIMULATOR PANEL --- */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Grid Column: Snapshot Inputs Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4 bg-slate-950/10 border border-white/[0.03] p-5 rounded-xl">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Cpu className="h-4 w-4 text-blue-400" />
              Live Technical Snapshot Input
            </h3>
            <p className="text-[10px] text-slate-500">Model the current price action details below to execute the rules evaluation.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className={labelClass}>Pair</label>
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
                  <option value="Daily">Daily</option>
                </select>
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
                  <option value="none">None (Out of Killzone)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Execution Timeframe Trend</label>
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
                <label className={labelClass}>HTF Bias Alignment</label>
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
                <label className={labelClass}>Fair Value Gap (FVG)</label>
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

              <div className="space-y-1">
                <label className={labelClass}>Liquidity Sweep Pool</label>
                <select 
                  value={snapshot.liquidity_sweep} 
                  onChange={(e) => setSnapshot({ ...snapshot, liquidity_sweep: e.target.value as 'high' | 'low' | 'none' })}
                  className={inputClass}
                >
                  <option value="high">High Swept (Sell Liquidity)</option>
                  <option value="low">Low Swept (Buy Liquidity)</option>
                  <option value="none">None</option>
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
                <label className={labelClass}>Asset Spread (Pips)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.0" 
                  value={snapshot.spread} 
                  onChange={(e) => setSnapshot({ ...snapshot, spread: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Binary Switch Buttons */}
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

            {/* Evaluate Trigger Button */}
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-1.5 py-3 mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40"
            >
              {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Evaluate Confluence Score
            </button>
          </div>

          {/* Right Grid Column: Engine Result Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {simFeedback && (
              <div className={`p-3.5 rounded-lg border text-xs font-mono ${
                simFeedback.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {simFeedback.message}
              </div>
            )}

            {!simulationResult ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-white/[0.03] rounded-xl bg-slate-950/10 min-h-[350px]">
                <Info className="h-8 w-8 text-slate-600 mb-2" />
                <h4 className="text-xs font-bold text-white">Awaiting Calculation</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Configure snapshot details and click evaluate to calculate real-time confluences.</p>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-950/15 border border-white/[0.05] p-5 rounded-xl">
                
                {/* Score Circular Gauge Representation */}
                <div className="flex items-center gap-4 border-b border-white/[0.03] pb-4">
                  {/* Visual Score Ring */}
                  <div className="relative flex items-center justify-center h-18 w-18 rounded-full border-3 border-dashed border-white/[0.08]">
                    <div className="text-center">
                      <span className="text-lg font-black text-white">{simulationResult.confluenceScore.toFixed(1)}</span>
                      <span className="text-[8px] text-slate-600 font-mono block">/10.0</span>
                    </div>
                  </div>
                  
                  {/* Bias & Recommendation */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        simulationResult.marketBias === 'bullish' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : simulationResult.marketBias === 'bearish'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {simulationResult.marketBias} bias
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${RECOMMENDATION_BADGES[simulationResult.recommendation]}`}>
                        {simulationResult.recommendation}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-mono">
                      Confidence Rate: <span className="text-white font-bold">{simulationResult.confidence}%</span>
                    </p>
                    <p className="text-[8px] text-slate-600 font-mono">
                      Signal Threshold: {settings.signal_threshold.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Rules Checklist Results */}
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Rule Breakdown</p>
                  
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {simulationResult.triggeredRules.map(r => (
                      <div key={r.ruleKey} className="flex items-center justify-between text-[10px] bg-white/[0.01] px-2 py-1.5 rounded border border-white/[0.02]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {r.isTriggered ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="text-slate-300 truncate font-semibold">{r.name}</span>
                        </div>
                        <span className={`text-[9px] font-mono shrink-0 ${r.isTriggered ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>
                          {r.isTriggered ? `+${r.weight.toFixed(1)}` : '0.0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation text */}
                <div className="space-y-1.5 pt-1.5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculated Explanation</p>
                  <div className="text-[10px] text-slate-400 leading-relaxed bg-white/[0.01] rounded-lg p-3 border border-white/[0.03] max-h-[140px] overflow-y-auto font-mono">
                    {simulationResult.explanation.replace(/### .*\n\n/g, '').replace(/\*\*.*\*\*/g, '')}
                  </div>
                </div>

                {/* Simulator Integration Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.03]">
                  <button
                    onClick={handleLogAnalysis}
                    disabled={isLogging || isSimulating}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isLogging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Log AI Analysis
                  </button>

                  <button
                    onClick={handleGenerateSignal}
                    disabled={
                      !loggedAnalysisId || 
                      isGeneratingSignal || 
                      simulationResult.confluenceScore < settings.signal_threshold ||
                      simulationResult.marketBias === 'neutral'
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      !loggedAnalysisId 
                        ? "Click 'Log AI Analysis' first to persist the entry." 
                        : simulationResult.confluenceScore < settings.signal_threshold 
                        ? `Score is below threshold (${settings.signal_threshold})` 
                        : "Dispatch trade signal."
                    }
                  >
                    {isGeneratingSignal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Generate Signal
                  </button>
                </div>
                
                {!loggedAnalysisId && (
                  <div className="flex items-center gap-1 text-[8px] text-amber-500 font-medium">
                    <ShieldAlert className="h-3 w-3 shrink-0" />
                    <span>You must &quot;Log AI Analysis&quot; first to enable Signal Generation.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
