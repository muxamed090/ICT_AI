'use client'

import React, { useState } from 'react'
import { BacktestReport } from '@/lib/backtest/types'

interface BacktestPanelProps {
    initialReport: BacktestReport | null
}

const outcomeColor: Record<string, string> = {
    win: 'text-emerald-400',
    loss: 'text-rose-400',
    breakeven: 'text-amber-400',
    pending: 'text-slate-400',
}

export default function BacktestPanel({ initialReport }: BacktestPanelProps) {
    const [report, setReport] = useState<BacktestReport | null>(initialReport)
    const [loading, setLoading] = useState(false)
    const [pair, setPair] = useState('EURUSD')
    const [direction, setDir] = useState('both')
    const [timeframe, setTF] = useState('H1')
    const [balance, setBalance] = useState('10000')
    const [risk, setRisk] = useState('1')
    const [tab, setTab] = useState<'overview' | 'trades' | 'sessions'>('overview')

    async function runTest() {
        setLoading(true)
        try {
            const params = new URLSearchParams({ pair, direction, timeframe, balance, risk })
            const res = await fetch('/api/backtest?' + params.toString())
            const data = await res.json()
            if (data.report) setReport(data.report)
        } catch (err) {
            console.error('Backtest error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Config Panel */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">⚙️ Backtest Configuration</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                        <p className="text-[10px] text-slate-500 mb-1">Pair</p>
                        <select
                            value={pair}
                            onChange={(e) => setPair(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                            {['EURUSD', 'XAUUSD', 'USDCAD', 'EURJPY'].map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 mb-1">Direction</p>
                        <select
                            value={direction}
                            onChange={(e) => setDir(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                            <option value="both">Both</option>
                            <option value="buy">Buy Only</option>
                            <option value="sell">Sell Only</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 mb-1">Timeframe</p>
                        <select
                            value={timeframe}
                            onChange={(e) => setTF(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                            {['M15', 'H1', 'H4'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 mb-1">Balance ($)</p>
                        <input
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 mb-1">Risk %</p>
                        <input
                            type="number"
                            value={risk}
                            onChange={(e) => setRisk(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                    </div>
                </div>
                <button
                    onClick={runTest}
                    disabled={loading}
                    className="mt-4 px-6 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-bold transition disabled:opacity-50"
                >
                    {loading ? '⏳ Running Backtest...' : '▶ Run Backtest'}
                </button>
            </div>

            {report && (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Trades', value: report.totalTrades.toString() },
                            { label: 'Win Rate', value: report.winRate + '%' },
                            { label: 'Profit Factor', value: report.profitFactor.toString() },
                            { label: 'Max Drawdown', value: report.maxDrawdown + '%' },
                            { label: 'Total P&L', value: '$' + report.totalPnl.toFixed(2) },
                            { label: 'Final Equity', value: '$' + report.finalEquity.toFixed(2) },
                            { label: 'Avg R:R', value: report.avgRR.toString() },
                            { label: 'Wins / Losses', value: report.wins + ' / ' + report.losses },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {(['overview', 'trades', 'sessions'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${tab === t
                                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                        : 'bg-white/[0.02] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]'
                                    }`}
                            >
                                {t === 'overview' ? '📊 Overview' : t === 'trades' ? '📋 Trades' : '🕐 Sessions'}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <div className="space-y-4">
                            {/* Equity Curve */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">📈 Equity Curve</p>
                                <div className="h-32 flex items-end gap-0.5">
                                    {report.equityCurve.slice(-40).map((pt, i) => {
                                        const min = Math.min(...report.equityCurve.map((p) => p.equity))
                                        const max = Math.max(...report.equityCurve.map((p) => p.equity))
                                        const range = max - min || 1
                                        const height = ((pt.equity - min) / range) * 100
                                        return (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-sm ${pt.equity >= report.config.accountBalance ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`}
                                                style={{ height: height + '%' }}
                                                title={'$' + pt.equity}
                                            />
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Pair Performance */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">💱 Pair Performance</p>
                                <div className="space-y-2">
                                    {Object.entries(report.pairPerformance).map(([p, stats]) => (
                                        <div key={p} className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white w-16">{p}</span>
                                            <div className="flex-1 mx-3 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${stats.winRate >= 60 ? 'bg-emerald-500' : stats.winRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: stats.winRate + '%' }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-400 w-20 text-right">
                                                WR: {stats.winRate}% | RR: {stats.avgRR}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Best/Worst */}
                            {(report.bestTrade || report.worstTrade) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {report.bestTrade && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                                            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">🏆 Best Trade</p>
                                            <p className="text-xs font-bold text-white">{report.bestTrade.pair} {report.bestTrade.direction.toUpperCase()}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">+${report.bestTrade.pnl.toFixed(2)} | R:R {report.bestTrade.rrAchieved}</p>
                                        </div>
                                    )}
                                    {report.worstTrade && (
                                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                                            <p className="text-[10px] text-rose-400 uppercase tracking-wider mb-2">📉 Worst Trade</p>
                                            <p className="text-xs font-bold text-white">{report.worstTrade.pair} {report.worstTrade.direction.toUpperCase()}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">${report.worstTrade.pnl.toFixed(2)} | R:R {report.worstTrade.rrAchieved}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trades Tab */}
                    {tab === 'trades' && (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                            <table className="w-full text-[10px]">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        {['Pair', 'Dir', 'Entry', 'SL', 'TP1', 'Outcome', 'R:R', 'P&L', 'Score', 'Session'].map((h) => (
                                            <th key={h} className="px-3 py-2 text-left text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.trades.slice(0, 30).map((t) => (
                                        <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                            <td className="px-3 py-2 font-bold text-white">{t.pair}</td>
                                            <td className={`px-3 py-2 font-bold ${t.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.direction.toUpperCase()}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-slate-300">{t.entryPrice.toFixed(5)}</td>
                                            <td className="px-3 py-2 font-mono text-rose-400">{t.stopLoss.toFixed(5)}</td>
                                            <td className="px-3 py-2 font-mono text-emerald-400">{t.tp1.toFixed(5)}</td>
                                            <td className={`px-3 py-2 font-bold ${outcomeColor[t.outcome]}`}>{t.outcome.toUpperCase()}</td>
                                            <td className="px-3 py-2 text-slate-300">{t.rrAchieved}</td>
                                            <td className={`px-3 py-2 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-slate-400">{t.decisionScore}</td>
                                            <td className="px-3 py-2 text-slate-500">{t.session}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Sessions Tab */}
                    {tab === 'sessions' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(report.sessionPerformance).map(([s, stats]) => (
                                <div key={s} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{s}</p>
                                    <p className="text-lg font-bold text-white">{stats.winRate}%</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{stats.wins}W / {stats.losses}L</p>
                                    <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${stats.winRate >= 60 ? 'bg-emerald-500' : stats.winRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: stats.winRate + '%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}