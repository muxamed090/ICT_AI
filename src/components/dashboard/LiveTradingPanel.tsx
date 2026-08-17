'use client'

import React, { useState } from 'react'

interface TradePlan {
    action: string
    entry: number
    stopLoss: number
    tp1: number
    tp2: number
    positionSize: number
    riskAmount: number
    rewardTP1: number
    rr: number
    grade: string
    confidence: number
    executionMode: string
}

interface LiveSignal {
    pair: string
    direction: 'buy' | 'sell'
    price: number
    action: string
    grade: string
    confidence: number
    executionMode: string
    tradePlan: TradePlan | null
    ictRec: string
    mlRec: string
    rulesGrade: string
    combinedScore: number
}

interface TradingState {
    isConnected: boolean
    brokerType: string
    accountBalance: number
    equity: number
    todayPnl: number
    todayTrades: number
    dailyDrawdown: number
    openPositions: unknown[]
}

const actionColor: Record<string, string> = {
    'BUY': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'SELL': 'text-rose-400   bg-rose-500/10    border-rose-500/20',
    'WAIT': 'text-amber-400  bg-amber-500/10   border-amber-500/20',
    'NO TRADE': 'text-slate-400  bg-slate-500/10   border-slate-500/20',
}

const gradeColor: Record<string, string> = {
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-amber-400',
    D: 'text-orange-400',
    F: 'text-rose-400',
}

export default function LiveTradingPanel({
    initialSignals,
    initialState,
    session,
    killzone,
}: {
    initialSignals: LiveSignal[]
    initialState: TradingState
    session: string
    killzone: string | null
}) {
    const [signals, setSignals] = useState<LiveSignal[]>(initialSignals)
    const [state] = useState<TradingState>(initialState)
    const [selected, setSelected] = useState<LiveSignal | null>(initialSignals[0] ?? null)
    const [loading, setLoading] = useState(false)
    const [executing, setExecuting] = useState<string | null>(null)
    const [executed, setExecuted] = useState<Record<string, string>>({})

    async function refresh() {
        setLoading(true)
        try {
            const res = await fetch('/api/live-trading')
            const data = await res.json()
            if (data.signals) {
                setSignals(data.signals)
                const sel = data.signals.find((s: LiveSignal) => s.pair === selected?.pair)
                if (sel) setSelected(sel)
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleExecute(signal: LiveSignal) {
        if (!signal.tradePlan) return
        setExecuting(signal.pair)
        try {
            await new Promise((r) => setTimeout(r, 800))
            const plan = signal.tradePlan
            const hour = new Date().getUTCHours()
            const session = (hour >= 7 && hour < 9) ? 'overlap' : (hour >= 7 && hour < 16) ? 'london' : (hour >= 12 && hour < 21) ? 'new_york' : 'asian'
            await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pair: signal.pair,
                    direction: signal.direction,
                    timeframe: 'H1',
                    session,
                    setup_type: 'BOS+FVG',
                    entry: plan.entry,
                    stop_loss: plan.stopLoss,
                    take_profit: plan.tp1,
                    risk_reward: plan.rr ?? 1.5,
                    result: 'pending',
                    pnl: 0,
                    notes: 'Auto-logged from Live Trading. Grade: ' + plan.grade + ' | Score: ' + plan.confidence,
                    ai_confidence: plan.confidence,
                }),
            })
            setExecuted((prev) => ({ ...prev, [signal.pair]: signal.action }))
        } catch (err) {
            console.error('Execute error:', err)
        } finally {
            setExecuting(null)
        }
    }

    const executable = signals.filter((s) => s.action === 'BUY' || s.action === 'SELL')

    return (
        <div className="space-y-6">
            {/* Header bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {state.brokerType.toUpperCase()} {state.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                        {session.replace('_', ' ').toUpperCase()}
                    </span>
                    {killzone && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            🎯 {killzone}
                        </span>
                    )}
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 text-xs transition disabled:opacity-50"
                >
                    {loading ? '⏳ Refreshing...' : '↻ Refresh'}
                </button>
            </div>

            {/* Account stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Balance', value: '$' + state.accountBalance.toLocaleString() },
                    { label: 'Today P&L', value: (state.todayPnl >= 0 ? '+' : '') + '$' + state.todayPnl },
                    { label: 'Daily Drawdown', value: state.dailyDrawdown + '%' },
                    { label: 'Open Positions', value: state.openPositions.length.toString() },
                ].map((item) => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Executable signals alert */}
            {executable.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">
                        🚀 {executable.length} Executable Signal{executable.length > 1 ? 's' : ''} Ready
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {executable.map((s) => (
                            <span key={s.pair} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${actionColor[s.action]}`}>
                                {s.pair} {s.action}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: signals list */}
                <div className="space-y-2">
                    {signals.map((s) => (
                        <button
                            key={s.pair}
                            onClick={() => setSelected(s)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.pair === s.pair
                                ? 'border-violet-500/40 bg-violet-500/10'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">{s.pair}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold ${gradeColor[s.grade]}`}>{s.grade}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${actionColor[s.action]}`}>
                                        {s.action}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                                <span>Score: <b className="text-white">{s.combinedScore}</b></span>
                                <span>Conf: <b className="text-white">{s.confidence}%</b></span>
                            </div>
                            {executed[s.pair] && (
                                <p className="text-[10px] text-emerald-400 mt-1">✅ Sent to MT4/MT5</p>
                            )}
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
                                    {selected.direction.toUpperCase()} · Score {selected.combinedScore} · {selected.executionMode}
                                </p>
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${actionColor[selected.action]}`}>
                                {selected.action}
                            </span>
                        </div>

                        {/* Engine consensus */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'ICT Engine', value: selected.ictRec },
                                { label: 'ML Engine', value: selected.mlRec },
                                { label: 'Rules Engine', value: selected.rulesGrade },
                            ].map((item) => (
                                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                                    <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Trade Plan */}
                        {selected.tradePlan ? (
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">📋 Trade Plan</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Entry', value: selected.tradePlan.entry.toFixed(5), cls: 'text-white' },
                                        { label: 'Stop Loss', value: selected.tradePlan.stopLoss.toFixed(5), cls: 'text-rose-400' },
                                        { label: 'TP1', value: selected.tradePlan.tp1.toFixed(5), cls: 'text-emerald-400' },
                                        { label: 'TP2', value: selected.tradePlan.tp2.toFixed(5), cls: 'text-emerald-400' },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-slate-950/40 rounded-lg p-2.5">
                                            <p className="text-[10px] text-slate-500">{item.label}</p>
                                            <p className={`text-xs font-mono font-bold mt-0.5 ${item.cls}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Position Size', value: selected.tradePlan.positionSize + ' lots' },
                                        { label: 'Risk', value: '$' + selected.tradePlan.riskAmount },
                                        { label: 'Reward TP1', value: '$' + selected.tradePlan.rewardTP1 },
                                        { label: 'R:R', value: selected.tradePlan.rr + ':1' },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <p className="text-[10px] text-slate-500">{item.label}</p>
                                            <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Execute button */}
                                {executed[selected.pair] ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                                        <p className="text-emerald-400 text-sm font-bold">✅ Trade Sent to MT4/MT5</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Execute manually in your broker platform</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                                            <p className="text-[10px] text-amber-400 mb-1">⚙️ Execution Mode: {selected.tradePlan.executionMode}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {selected.tradePlan.executionMode === 'Manual'
                                                    ? 'Copy trade details to MT4/MT5 and execute manually'
                                                    : 'One-click execution via broker bridge'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleExecute(selected)}
                                            disabled={executing === selected.pair}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition ${selected.action === 'BUY'
                                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400'
                                                : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400'
                                                } disabled:opacity-50`}
                                        >
                                            {executing === selected.pair
                                                ? '⏳ Executing...'
                                                : selected.action === 'BUY'
                                                    ? '🟢 Execute BUY — ' + selected.pair
                                                    : '🔴 Execute SELL — ' + selected.pair}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
                                <p className="text-slate-500 text-sm">{selected.action} — No trade plan available</p>
                                <p className="text-[10px] text-slate-600 mt-1">Wait for a stronger signal</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}