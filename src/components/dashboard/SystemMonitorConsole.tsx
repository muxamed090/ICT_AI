'use client'

import React, { useState } from 'react'
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Info,
  ShieldAlert, Clock, Cpu, Database, Radio
} from 'lucide-react'
import { BrokerAccount, BrokerLog } from '@/types/database'

interface SystemMonitorConsoleProps {
  accounts: BrokerAccount[]
  allLogs: BrokerLog[]
  executionLogs: BrokerLog[]
  riskLogs: BrokerLog[]
}

type FilterKey = 'all' | 'execution' | 'risk' | 'connection' | 'system'

const LOG_LEVEL_CONFIG = {
  info: { icon: <Info className="h-3 w-3" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  warn: { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  error: { icon: <XCircle className="h-3 w-3" />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  security: { icon: <ShieldAlert className="h-3 w-3" />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  circuit_breaker: { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
} as const

export default function SystemMonitorConsole({
  accounts,
  allLogs,
  executionLogs,
  riskLogs,
}: SystemMonitorConsoleProps) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const filteredLogs = filter === 'all' ? allLogs
    : filter === 'execution' ? executionLogs
    : filter === 'risk' ? riskLogs
    : allLogs.filter((l) => l.category === filter)

  const errorCount = allLogs.filter((l) => l.log_level === 'error' || l.log_level === 'circuit_breaker').length
  const warnCount = allLogs.filter((l) => l.log_level === 'warn').length
  const successCount = allLogs.filter((l) => l.log_level === 'info').length

  const connectedAccounts = accounts.filter((a) => a.connection_status === 'connected')
  const errorAccounts = accounts.filter((a) => a.connection_status === 'error')

  return (
    <div className="space-y-5">

      {/* ── Summary Metrics ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Cpu className="h-3 w-3" /> Total Logs
          </p>
          <p className="text-2xl font-bold text-white">{allLogs.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[10px] font-semibold text-emerald-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Info Events
          </p>
          <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Warnings
          </p>
          <p className="text-2xl font-bold text-amber-400">{warnCount}</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-[10px] font-semibold text-rose-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <XCircle className="h-3 w-3" /> Errors
          </p>
          <p className="text-2xl font-bold text-rose-400">{errorCount}</p>
        </div>
        <div className={`rounded-xl border p-4 ${errorAccounts.length > 0 ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${errorAccounts.length > 0 ? 'text-rose-500/70' : 'text-emerald-500/70'}`}>
            <Radio className="h-3 w-3" /> Broker Status
          </p>
          <p className={`text-sm font-bold ${errorAccounts.length > 0 ? 'text-rose-400' : connectedAccounts.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {errorAccounts.length > 0 ? `${errorAccounts.length} Error(s)` : connectedAccounts.length > 0 ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>

      {/* ── Broker Health Row ─────────────────────────────────────── */}
      {accounts.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-400" />
            Broker Account Status
          </h3>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    acc.connection_status === 'connected' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                    acc.connection_status === 'error' ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                    'bg-slate-600'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{acc.account_name}</p>
                    <p className="text-[10px] text-slate-500">{acc.broker_type.toUpperCase()} · {acc.account_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase">Balance</p>
                    <p className="text-xs font-bold text-white">${acc.balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase">Equity</p>
                    <p className="text-xs font-bold text-white">${acc.equity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase">Free Margin</p>
                    <p className="text-xs font-bold text-white">${acc.free_margin.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase">Last Ping</p>
                    <p className="text-xs text-slate-400">
                      {acc.last_ping_at ? new Date(acc.last_ping_at).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                    acc.connection_status === 'connected' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    acc.connection_status === 'error' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    'text-slate-500 bg-white/[0.03] border-white/[0.06]'
                  }`}>{acc.connection_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Log Table ──────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Audit Log</h3>
          </div>
          <div className="flex gap-1">
            {(['all', 'execution', 'risk', 'connection', 'system'] as FilterKey[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold rounded capitalize transition-colors ${
                  filter === f
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-8 w-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No logs in this category</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0A1019]">
                <tr className="border-b border-white/[0.06]">
                  {['Time', 'Level', 'Category', 'Message'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-widest text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const config = LOG_LEVEL_CONFIG[log.log_level]
                  return (
                    <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors last:border-0">
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${config.color} ${config.bg}`}>
                          {config.icon}
                          {log.log_level}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 capitalize">{log.category}</td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-xs">{log.message}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
