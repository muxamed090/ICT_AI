'use client'

import React, { useState } from 'react'
import { EngineOutput } from '@/lib/engine/types'

const recColor: Record<string, string> = {
  'STRONG BUY': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'BUY': 'text-emerald-300 bg-emerald-500/5  border-emerald-500/10',
  'STRONG SELL': 'text-rose-400   bg-rose-500/10    border-rose-500/20',
  'SELL': 'text-rose-300   bg-rose-500/5     border-rose-500/10',
  'WAIT': 'text-amber-400  bg-amber-500/10   border-amber-500/20',
  'NO TRADE': 'text-slate-400  bg-slate-500/10   border-slate-500/20',
}

const riskColor: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-rose-400',
}

export default function AIAnalysisPanel({ analyses }: { analyses: EngineOutput[] }) {
  const [selected, setSelected] = useState<EngineOutput | null>(analyses[0] ?? null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Signal list */}
      <div className="space-y-2">
        {analyses.map((a) => (
          <button
            key={a.pair}
            onClick={() => setSelected(a)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.pair === a.pair
                ? 'border-violet-500/40 bg-violet-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{a.pair}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${recColor[a.recommendation] ?? ''}`}>
                {a.recommendation}
              </span>
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
              <span>Conf: <b className="text-white">{a.confidence}%</b></span>
              <span>R:R <b className="text-white">{a.riskRewardRatio}</b></span>
              <span className={riskColor[a.risk]}>Risk: {a.risk}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Right: Detail */}
      {selected && (
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{selected.pair}</h2>
              <p className="text-slate-400 text-xs">{selected.direction.toUpperCase()} · {selected.trend} · {selected.marketBias}</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${recColor[selected.recommendation] ?? ''}`}>
              {selected.recommendation}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Confidence', value: selected.confidence + '%' },
              { label: 'Risk', value: selected.risk, cls: riskColor[selected.risk] },
              { label: 'Momentum', value: selected.momentum },
              { label: 'Entry Quality', value: selected.entryQuality },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className={`text-sm font-bold mt-1 ${item.cls ?? 'text-white'}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Price levels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Entry', value: selected.entry.toFixed(5), cls: 'text-white' },
              { label: 'Stop Loss', value: selected.stop_loss.toFixed(5), cls: 'text-rose-400' },
              { label: 'TP1', value: selected.tp1.toFixed(5), cls: 'text-emerald-400' },
              { label: 'TP2', value: selected.tp2.toFixed(5), cls: 'text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className={`text-xs font-mono font-bold mt-1 ${item.cls}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Reasons */}
          {selected.reasons.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">✅ Reasons</p>
              {selected.reasons.map((r, i) => (
                <p key={i} className="text-xs text-slate-300 font-mono">• {r}</p>
              ))}
            </div>
          )}

          {/* Warnings */}
          {selected.warnings.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-rose-400 uppercase tracking-wider mb-2">⚠️ Warnings</p>
              {selected.warnings.map((w, i) => (
                <p key={i} className="text-xs text-rose-300 font-mono">• {w}</p>
              ))}
            </div>
          )}

          {/* Trade summary */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-2">📋 Trade Summary</p>
            <p className="text-xs text-slate-300 font-mono leading-5">{selected.tradeSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}