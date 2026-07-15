'use client'

import React, { useState } from 'react'
import { SystemHealth, StatusCheck } from '@/lib/monitor/types'

const statusColor: Record<string, string> = {
    healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400  bg-amber-500/10   border-amber-500/20',
    error: 'text-rose-400   bg-rose-500/10    border-rose-500/20',
    unknown: 'text-slate-400  bg-slate-500/10   border-slate-500/20',
}

const statusDot: Record<string, string> = {
    healthy: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    unknown: 'bg-slate-400',
}

const statusIcon: Record<string, string> = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌',
    unknown: '❓',
}

function CheckCard({ check }: { check: StatusCheck }) {
    return (
        <div className={`p-3 rounded-xl border ${statusColor[check.status]}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{check.name}</span>
                <span className="text-[10px]">{statusIcon[check.status]}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-4">{check.message}</p>
            {check.responseTime !== undefined && (
                <p className="text-[10px] text-slate-500 mt-1">{check.responseTime}ms</p>
            )}
        </div>
    )
}

export default function SystemMonitorPanel({
    initialHealth,
}: {
    initialHealth: SystemHealth | null
}) {
    const [health, setHealth] = useState<SystemHealth | null>(initialHealth)
    const [loading, setLoading] = useState(false)

    async function refresh() {
        setLoading(true)
        try {
            const res = await fetch('/api/system-monitor')
            const data = await res.json()
            if (data.health) setHealth(data.health)
        } finally {
            setLoading(false)
        }
    }

    if (!health) {
        return <div className="text-center py-20 text-slate-500 text-sm">No system data available.</div>
    }

    return (
        <div className="space-y-6">
            {/* Overall status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${statusDot[health.overall]}`} />
                    <div>
                        <p className="text-white font-bold text-sm">
                            System {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            Last checked: {new Date(health.checkedAt).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 text-xs transition disabled:opacity-50"
                >
                    {loading ? '⏳ Checking...' : '↻ Refresh'}
                </button>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Avg Response', value: health.performance.avgResponseTime + 'ms' },
                    { label: 'Error Rate', value: health.performance.errorRate + '%' },
                    { label: 'Uptime', value: health.performance.uptime + 'h' },
                    { label: 'Broker', value: health.broker.type.toUpperCase() },
                ].map((item) => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Engines */}
            <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">⚙️ Engine Status</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CheckCard check={health.engines.ictEngine} />
                    <CheckCard check={health.engines.mlEngine} />
                    <CheckCard check={health.engines.rulesEngine} />
                    <CheckCard check={health.engines.decisionEngine} />
                </div>
            </div>

            {/* APIs */}
            <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">🌐 API Status</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <CheckCard check={health.apis.twelveData} />
                    <CheckCard check={health.apis.forexFactory} />
                    <CheckCard check={health.apis.supabase} />
                </div>
            </div>

            {/* Broker */}
            <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">🔌 Broker Status</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CheckCard check={health.broker.connection} />
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Broker Info</p>
                        <p className="text-xs font-bold text-white">{health.broker.type.toUpperCase()}</p>
                        {health.broker.accountId && (
                            <p className="text-[10px] text-slate-400 mt-1">ID: {health.broker.accountId}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <table className="w-full text-[10px]">
                    <thead>
                        <tr className="border-b border-white/[0.06]">
                            {['Component', 'Status', 'Message', 'Response'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            health.engines.ictEngine,
                            health.engines.mlEngine,
                            health.engines.rulesEngine,
                            health.engines.decisionEngine,
                            health.apis.twelveData,
                            health.apis.forexFactory,
                            health.apis.supabase,
                            health.broker.connection,
                        ].map((check) => (
                            <tr key={check.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                <td className="px-3 py-2 font-bold text-white">{check.name}</td>
                                <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusColor[check.status]}`}>
                                        {check.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-slate-400 max-w-xs truncate">{check.message}</td>
                                <td className="px-3 py-2 text-slate-500 font-mono">
                                    {check.responseTime !== undefined ? check.responseTime + 'ms' : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}