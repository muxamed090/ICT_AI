'use client'

import React, { useState } from 'react'
import { DecisionOutput } from '@/lib/decision/types'

interface DecisionWithTrace extends DecisionOutput {
    trace?: string[]
}

const actionColor: Record<string, string> = {
    'BUY': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'SELL': 'text-rose-400   bg-rose-500/10    border-rose-500/20',
    'WAIT': 'text-amber-400  bg-amber-500/10   border-amber-500/20',
    'NO TRADE': 'text-slate-400  bg-slate-500/10   border-slate-500/20',
}

const gradeColor: Record<string, string> = {
    A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    B: 'text-blue-400    bg-blue-500/10    border-blue-500/20',
    C: 'text-amber-400   bg-amber-500/10   border-amber-500/20',
    D: 'text-orange-400  bg-orange-500/10  border-orange-500/20',
    F: 'text-rose-400    bg-rose-500/10    border-rose-500/20',
}

const modeColor: Record<string, string> = {
    'Semi-Auto': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    'Manual': 'text-slate-400  bg-slate-500/10  border-slate-500/20',
    'Auto': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export default function DecisionEnginePanel({
    decisions,
    session,
    killzone,
}: {
    decisions: DecisionWithTrace[]
    session: string
    killzone: string | null
}) {
    const safe = Array.isArray(decisions) ? decisions : []
    const [selected, setSelected] = useState<DecisionWithTrace | null>(safe[0] ?? null)

    if (safe.length === 0) {
        return <div className="text-center py-20 text-slate-500 text-sm">No decisions available.</div>
    }

    return (
        <div className="space-y-6">
            {/* Session + Killzone */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Session:</span>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                        {session.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                {killzone && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Killzone:</span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            🎯 {killzone}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: pair list */}
                <div className="space-y-2">
                    {safe.map((d) => (
                        <button
                            key={d.pair}
                            onClick={() => setSelected(d)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.pair === d.pair
                                    ? 'border-violet-500/40 bg-violet-500/10'
                                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">{d.pair}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeColor[d.grade]}`}>
                                        {d.grade}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${actionColor[d.action]}`}>
                                        {d.action}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                                <span>Score: <b className="text-white">{d.confidence}</b></span>
                                <span>R:R <b className="text-white">{d.risk.riskRewardTP1}</b></span>
                                <span className={modeColor[d.executionMode].split(' ')[0]}>{d.executionMode}</span>
                            </div>
                            <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${d.grade === 'A' ? 'bg-emerald-500' :
                                            d.grade === 'B' ? 'bg-blue-500' :
                                                d.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                    style={{ width: d.confidence + '%' }}
                                />
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
                                    {selected.direction.toUpperCase()} · Score {selected.confidence} · {selected.entry.entryQuality}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${gradeColor[selected.grade]}`}>
                                    {selected.grade}
                                </span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${actionColor[selected.action]}`}>
                                    {selected.action}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${modeColor[selected.executionMode]}`}>
                                    {selected.executionMode}
                                </span>
                            </div>
                        </div>

                        {/* Price levels */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Optimal Entry', value: selected.entry.optimalEntry.toFixed(5), cls: 'text-white' },
                                { label: 'Stop Loss', value: selected.stop_loss.toFixed(5), cls: 'text-rose-400' },
                                { label: 'Take Profit 1', value: selected.tp1.toFixed(5), cls: 'text-emerald-400' },
                                { label: 'Take Profit 2', value: selected.tp2.toFixed(5), cls: 'text-emerald-400' },
                            ].map((item) => (
                                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                                    <p className={`text-xs font-mono font-bold mt-1 ${item.cls}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Risk Plan */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">💰 Risk Plan</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Position Size', value: selected.risk.positionSizeLots + ' lots' },
                                    { label: 'Risk Amount', value: '$' + selected.risk.riskAmount },
                                    { label: 'Reward TP1', value: '$' + selected.risk.rewardTP1 },
                                    { label: 'R:R Ratio', value: selected.risk.riskRewardTP1 + ':1' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <p className="text-[10px] text-slate-500">{item.label}</p>
                                        <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Signal Aggregation */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📊 Signal Aggregation</p>
                            {[
                                { label: 'ICT Engine', value: selected.aggregated.ictScore, weight: '30%' },
                                { label: 'ML Engine', value: selected.aggregated.mlScore, weight: '35%' },
                                { label: 'Rules Engine', value: selected.aggregated.rulesScore, weight: '35%' },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-slate-400">{item.label} <span className="text-slate-600">({item.weight})</span></span>
                                        <span className="text-white font-bold">{item.value.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.value >= 80 ? 'bg-emerald-500' :
                                                    item.value >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                                }`}
                                            style={{ width: item.value + '%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 border-t border-white/[0.06] flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Combined Score</span>
                                <span className="text-white font-bold">{selected.aggregated.combinedScore}</span>
                            </div>
                        </div>

                        {/* Entry Optimization */}
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">🎯 Entry Optimization</p>
                            <p className="text-xs text-slate-300">{selected.entry.entryReason}</p>
                        </div>

                        {/* Decision Trace */}
                        {selected.trace && selected.trace.length > 0 && (
                            <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">🔍 Decision Trace</p>
                                {selected.trace.map((line, i) => (
                                    <p key={i} className={`text-xs font-mono leading-6 ${line.startsWith('✓') ? 'text-emerald-400' :
                                            line.startsWith('✗') ? 'text-rose-400' :
                                                line.startsWith('─') ? 'text-slate-600' :
                                                    line.startsWith('Decision') ? 'text-white font-bold' :
                                                        'text-slate-400'
                                        }`}>{line}</p>
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

                        {/* Decision Summary */}
                        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                            <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-2">📋 Decision Summary</p>
                            <p className="text-xs text-slate-300 font-mono leading-5">{selected.summary}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}