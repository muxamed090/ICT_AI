'use client'

import React, { useState } from 'react'
import { EngineOutput } from '@/lib/engine/types'
import { MLOutput } from '@/lib/ml/types'

interface MLResult {
  pair: string
  direction: 'buy' | 'sell'
  price: number
  ictResult: EngineOutput
  mlResult: MLOutput
}

const recColor: Record<string, string> = {
  'TAKE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'WATCH': 'text-amber-400  bg-amber-500/10   border-amber-500/20',
  'SKIP': 'text-rose-400   bg-rose-500/10    border-rose-500/20',
}

const riskColor: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-rose-400',
}

export default function MLEnginePanel({ results, session }: { results: MLResult[]; session: string }) {
  const [selected, setSelected] = useState<MLResult | null>(
    Array.isArray(results) && results.length > 0 ? results[0] : null
  )

  if (!Array.isArray(results) || results.length === 0) {
    return <div className="text-center py-20 text-slate-500 text-sm">No ML data available.</div>
  }

  return (
    <div className="space-y-6">
      {/* Session badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Current Session:</span>
        <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
          {session.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: pair list */}
        <div className="space-y-2">
          {results.map((r) => (
            <button
              key={r.pair}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.pair === r.pair
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{r.pair}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${recColor[r.mlResult.prediction.recommendation] ?? ''}`}>
                  {r.mlResult.prediction.recommendation}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                <span>ML Score: <b className="text-white">{r.mlResult.mlScore}</b></span>
                <span>Conf: <b className="text-white">{r.mlResult.adjustedConfidence}%</b></span>
                <span>WR: <b className="text-white">{r.mlResult.prediction.expectedWinRate}%</b></span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{selected.pair}</h2>
                <p className="text-slate-400 text-xs">
                  {selected.direction.toUpperCase()} · ICT: {selected.ictResult.recommendation} · ML: {selected.mlResult.prediction.recommendation}
                </p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${recColor[selected.mlResult.prediction.recommendation] ?? ''}`}>
                {selected.mlResult.prediction.recommendation}
              </span>
            </div>

            {/* ML Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'ML Score', value: selected.mlResult.mlScore.toString() },
                { label: 'Adj. Confidence', value: selected.mlResult.adjustedConfidence + '%' },
                { label: 'Expected WR', value: selected.mlResult.prediction.expectedWinRate + '%' },
                { label: 'Expected R:R', value: selected.mlResult.prediction.expectedRR.toString() },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Adaptive Confidence Breakdown */}

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📊 Adaptive Confidence Breakdown</p>
              {(() => {
                const reasons = selected.mlResult.prediction.reasons
                const items = [
                  { label: 'Trend', key: 'Trend' },
                  { label: 'Momentum', key: 'Momentum' },
                  { label: 'History', key: 'History' },
                  { label: 'Risk', key: 'Risk' },
                  { label: 'Liquidity', key: 'Liquidity' },
                ].map((item) => {
                  const line = reasons.find((r) => r.startsWith('• ' + item.key) || r.includes(item.key + ' '))
                  const match = line?.match(/(\d+)%/)
                  const value = match ? parseInt(match[1]) : (selected.mlResult.prediction.components?.[item.key.toLowerCase() as keyof typeof selected.mlResult.prediction.components] ?? 0)
                  return { ...item, value }
                })
                return items.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-white font-bold">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${item.value >= 80 ? 'bg-emerald-500' :
                            item.value >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                        style={{ width: item.value + '%' }}
                      />
                    </div>
                  </div>
                ))
              })()}
              <div className="pt-2 border-t border-white/[0.06] flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Final Confidence</span>
                <span className="text-white font-bold">{selected.mlResult.adjustedConfidence}%</span>
              </div>
            </div>
            {/* Historical Performance */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">📈 Historical Performance</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Total Trades', value: selected.mlResult.performance.totalTrades.toString() },
                  { label: 'Win Rate', value: selected.mlResult.performance.winRate + '%' },
                  { label: 'Avg R:R', value: selected.mlResult.performance.avgRR.toString() },
                  { label: 'Best Pair', value: selected.mlResult.performance.bestPair },
                  { label: 'Best Session', value: selected.mlResult.performance.bestSession },
                  { label: 'Profit Factor', value: selected.mlResult.performance.profitFactor.toString() },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Match */}
            {selected.mlResult.patternStats && (
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-3">🔍 Pattern Match</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Trades', value: selected.mlResult.patternStats.totalTrades.toString() },
                    { label: 'Win Rate', value: selected.mlResult.patternStats.winRate + '%' },
                    { label: 'Avg R:R', value: selected.mlResult.patternStats.avgRR.toString() },
                    { label: 'Pattern Score', value: selected.mlResult.patternStats.patternScore.toString() },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-slate-500">{item.label}</p>
                      <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ML Reasoning */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">🤖 ML Reasoning</p>
              {selected.mlResult.prediction.reasons
                .filter((r) => !r.includes('──') && !r.includes('........') && !r.includes('Final Confidence') && r.trim() !== '')
                .map((r, i) => (
                  <p key={i} className="text-xs text-slate-300 font-mono">• {r}</p>
                ))}
              <p className="text-xs text-slate-400 font-mono mt-2">
                • Expected Holding Time: {selected.mlResult.prediction.expectedHoldingHours}h
              </p>
            </div>

            {/* ICT vs ML */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">⚙️ ICT Engine</p>
                <p className="text-sm font-bold text-white">{selected.ictResult.recommendation}</p>
                <p className="text-xs text-slate-400 mt-1">Conf: {selected.ictResult.confidence}%</p>
                <p className={`text-xs mt-1 ${riskColor[selected.ictResult.risk]}`}>Risk: {selected.ictResult.risk}</p>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-2">🧠 ML Engine</p>
                <p className="text-sm font-bold text-white">{selected.mlResult.prediction.recommendation}</p>
                <p className="text-xs text-slate-400 mt-1">Conf: {selected.mlResult.adjustedConfidence}%</p>
                <p className="text-xs text-slate-400 mt-1">Score: {selected.mlResult.mlScore}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}