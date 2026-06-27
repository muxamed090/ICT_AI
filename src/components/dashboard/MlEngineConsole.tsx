"use client"

import React, { useState, useTransition } from 'react'
import { Brain, Loader2, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Zap, Database } from 'lucide-react'
import {
  MlModelRegistry,
  MlPrediction,
  UserSettings,
  MlTrainingResult,
} from '@/types/database'
import { triggerMlTrainingAction } from '@/actions/mlActions'

interface MlEngineConsoleProps {
  activeModel: MlModelRegistry | null
  stats: { total: number; withOutcomes: number; correct: number; accuracyRate: number }
  canTrain: boolean
  initialPredictions: MlPrediction[]
  modelHistory: MlModelRegistry[]
  settings: UserSettings
  baseRuleCount: number
}

const STATUS_LABELS = {
  INSUFFICIENT_DATA: { label: 'Insufficient Data', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  READY:             { label: 'Ready to Train',    color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  TRAINED:           { label: 'Model Active',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
} as const

type ModelStatus = keyof typeof STATUS_LABELS

export default function MlEngineConsole({
  activeModel,
  stats,
  canTrain,
  initialPredictions,
  modelHistory,
  settings,
}: MlEngineConsoleProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'models'>('status')
  const predictions = initialPredictions
  const [currentModel, setCurrentModel] = useState<MlModelRegistry | null>(activeModel)
  const [lastResult, setLastResult] = useState<MlTrainingResult | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isTraining, startTraining] = useTransition()

  const modelStatus: ModelStatus = currentModel
    ? 'TRAINED'
    : canTrain
    ? 'READY'
    : 'INSUFFICIENT_DATA'

  const status = STATUS_LABELS[modelStatus]
  const labelClass = 'text-[9px] font-bold text-slate-500 uppercase tracking-widest'

  const handleTriggerTraining = () => {
    setFeedback(null)
    startTraining(async () => {
      const result = await triggerMlTrainingAction({
        mlMode: settings.ml_mode,
        minSamples: settings.ml_min_training_samples,
      })
      if (result.success && result.data) {
        setLastResult(result.data)
        // Optimistically update the model status badge to TRAINED
        setCurrentModel(prev => ({
          ...(prev ?? {} as MlModelRegistry),
          model_version: result.data!.modelVersion,
          accuracy_rate: result.data!.accuracyRate,
          training_samples: result.data!.trainingSamples,
          is_active: true,
          ml_mode: settings.ml_mode,
          rule_weights: {},
          pattern_stats: {},
          avg_confidence: 0,
          trained_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          id: prev?.id ?? '',
          user_id: prev?.user_id ?? '',
        }))
        setFeedback({
          type: 'success',
          message: `Training complete! Model ${result.data.modelVersion} trained on ${result.data.trainingSamples} samples — ${result.data.accuracyRate.toFixed(1)}% accuracy.`,
        })
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Training cycle failed.' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/[0.04] gap-6">
        {([['status', 'Model Status'], ['history', `Prediction History (${predictions.length})`], ['models', `Model Versions (${modelHistory.length})`]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold transition-all ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Model Status Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-white/[0.03] pb-3">
                <Brain className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="text-xs font-bold text-white">ML Model Status</h3>
                  <p className="text-[10px] text-slate-500">Continuous learning pipeline powered by historical trade outcomes.</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${status.bg}`}>
                <div>
                  <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase block">Engine Status</span>
                  <h2 className={`text-lg font-black uppercase tracking-wider ${status.color}`}>{status.label}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 block">Active Model</span>
                  <span className={`text-sm font-extrabold font-mono ${status.color}`}>
                    {currentModel?.model_version ?? '—'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Predictions', value: String(stats.total), icon: <Database className="h-3 w-3" /> },
                  { label: 'With Outcomes', value: String(stats.withOutcomes), icon: <CheckCircle className="h-3 w-3" /> },
                  { label: 'Correct', value: String(stats.correct), icon: <Zap className="h-3 w-3" /> },
                  { label: 'Accuracy Rate', value: `${stats.accuracyRate.toFixed(1)}%`, icon: <BarChart3 className="h-3 w-3" /> },
                ].map(item => (
                  <div key={item.label} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1 text-slate-500">{item.icon}<span className={labelClass}>{item.label}</span></div>
                    <p className="text-lg font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Training threshold indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={labelClass}>Training Progress</span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {stats.withOutcomes} / {settings.ml_min_training_samples} samples
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${canTrain ? 'bg-emerald-500' : 'bg-blue-500/60'}`}
                    style={{ width: `${Math.min(100, (stats.withOutcomes / settings.ml_min_training_samples) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>

              {/* Active model detail */}
              {currentModel && (
                <div className="space-y-2">
                  <p className={labelClass}>Active Model Details</p>
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                    <div className="bg-white/[0.02] p-2 rounded border border-white/[0.03] space-y-0.5">
                      <span className="text-slate-500 block">Accuracy</span>
                      <span className="text-emerald-400 font-bold">{currentModel.accuracy_rate.toFixed(1)}%</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded border border-white/[0.03] space-y-0.5">
                      <span className="text-slate-500 block">Trained On</span>
                      <span className="text-white font-bold">{currentModel.training_samples} samples</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded border border-white/[0.03] space-y-0.5">
                      <span className="text-slate-500 block">ML Mode</span>
                      <span className="text-blue-400 font-bold uppercase">{currentModel.ml_mode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last training result */}
              {lastResult && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                  <p className={labelClass}>Last Training Cycle Result</p>
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Version</span>
                      <span className="text-emerald-400">{lastResult.modelVersion}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Samples</span>
                      <span className="text-white">{lastResult.trainingSamples}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Duration</span>
                      <span className="text-white">{lastResult.durationMs}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {feedback && (
                <div className={`p-3 rounded-lg border text-xs font-mono ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {feedback.message}
                </div>
              )}

              <button
                onClick={handleTriggerTraining}
                disabled={isTraining || !canTrain}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                {isTraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isTraining ? 'Training in Progress...' : canTrain ? 'Trigger Training Cycle' : `Need ${settings.ml_min_training_samples - stats.withOutcomes} more outcomes to train`}
              </button>
            </div>
          </div>

          {/* Right: Rule Weights (if model exists) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white">Calibrated Rule Weights</h3>
                <p className="text-[10px] text-slate-500">Weights adjusted by historical outcome accuracy.</p>
              </div>
              {currentModel && Object.keys(currentModel.rule_weights).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(currentModel.rule_weights).map(([ruleKey, val]) => {
                    const entry = typeof val === 'object' && val !== null ? val as Record<string, unknown> : {}
                    const accuracy = typeof entry.accuracyRate === 'number' ? entry.accuracyRate : 0
                    const calibrated = typeof entry.calibratedWeight === 'number' ? entry.calibratedWeight : 0
                    const samples = typeof entry.totalSamples === 'number' ? entry.totalSamples : 0
                    return (
                      <div key={ruleKey} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{ruleKey}</p>
                          <p className="text-[8px] text-slate-500">{samples} samples</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[9px] font-mono text-slate-400">{(accuracy * 100).toFixed(0)}% acc</p>
                            <p className="text-[10px] font-mono font-bold text-white">{calibrated.toFixed(2)} wt</p>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${accuracy >= 0.6 ? 'bg-emerald-400' : accuracy >= 0.4 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-[10px] text-slate-500">No calibrated weights yet.<br />Complete a training cycle to see per-rule accuracy data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white">ML Prediction History Log</h3>
            <p className="text-[10px] text-slate-500">Every ML inference recorded with its outcome for continuous learning.</p>
          </div>
          {predictions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No ML predictions recorded yet. Run the Decision Engine in hybrid or ml_priority mode to begin.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-slate-500 uppercase tracking-widest font-bold text-[8px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">ML Score</th>
                    <th className="py-2.5 px-3">ML Rec.</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {predictions.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[9px]">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{p.pair}</td>
                      <td className="py-2.5 px-3 text-slate-400 capitalize">{p.session.replace('_', ' ')}</td>
                      <td className="py-2.5 px-3 font-mono">{Number(p.ml_score).toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          p.ml_recommendation === 'ENTRY'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          p.ml_recommendation === 'WATCH'  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          p.ml_recommendation === 'WAIT'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {p.ml_recommendation}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{Number(p.ml_confidence).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">
                        {p.is_correct === null ? (
                          <span className="flex items-center gap-1 text-slate-500 text-[9px]"><Clock className="h-3 w-3" /> Pending</span>
                        ) : p.is_correct ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-bold"><CheckCircle className="h-3 w-3" /> Win</span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 text-[9px] font-bold"><XCircle className="h-3 w-3" /> Loss</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white">Model Version Registry</h3>
            <p className="text-[10px] text-slate-500">Complete history of all trained ML model snapshots.</p>
          </div>
          {modelHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No model versions yet. Trigger a training cycle to create the first model.</div>
          ) : (
            <div className="space-y-2">
              {modelHistory.map(m => (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${m.is_active ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/[0.01] border-white/[0.03]'}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{m.model_version}</span>
                      {m.is_active && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold uppercase">Active</span>}
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Trained: {new Date(m.trained_at).toLocaleString()} · Mode: {m.ml_mode}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs font-bold text-white">{m.accuracy_rate.toFixed(1)}% accuracy</p>
                    <p className="text-[9px] font-mono text-slate-400">{m.training_samples} samples</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
