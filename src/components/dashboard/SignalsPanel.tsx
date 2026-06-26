"use client"

import React, { useState } from 'react'
import { Signal } from '@/types/database'
import DataTable, { DataTableColumn } from '@/components/common/DataTable'
import FilterDropdown from '@/components/common/FilterDropdown'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]

const DIRECTION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
]

const statusBadge: Record<string, string> = {
  pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  expired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

interface SignalsPanelProps {
  signals: Signal[]
}

export default function SignalsPanel({ signals }: SignalsPanelProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [dirFilter, setDirFilter] = useState('all')

  const filtered = signals
    .filter((s) => statusFilter === 'all' || s.status === statusFilter)
    .filter((s) => dirFilter === 'all' || s.direction === dirFilter)

  const columns: DataTableColumn<Signal>[] = [
    {
      key: 'pair', header: 'Pair', sortable: true, searchable: true,
      render: (s) => <span className="font-bold text-white">{s.pair}</span>,
    },
    {
      key: 'direction', header: 'Dir',
      render: (s) => (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
          s.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>{s.direction}</span>
      ),
    },
    {
      key: 'entry', header: 'Entry',
      accessor: (s) => Number(s.entry),
      render: (s) => <span className="font-mono text-white">{Number(s.entry).toFixed(5)}</span>,
    },
    {
      key: 'stop_loss', header: 'SL',
      render: (s) => <span className="font-mono text-rose-400 text-[10px]">{Number(s.stop_loss).toFixed(5)}</span>,
    },
    {
      key: 'tp1', header: 'TP1',
      render: (s) => <span className="font-mono text-emerald-400 text-[10px]">{Number(s.tp1).toFixed(5)}</span>,
    },
    {
      key: 'tp2', header: 'TP2',
      render: (s) => <span className="font-mono text-emerald-400 text-[10px]">{Number(s.tp2).toFixed(5)}</span>,
    },
    {
      key: 'score', header: 'Score', sortable: true,
      accessor: (s) => Number(s.score),
      render: (s) => (
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Number(s.score))}%` }} />
          </div>
          <span className="text-[9px] font-mono text-white font-bold w-6 text-right">{Number(s.score).toFixed(0)}</span>
        </div>
      ),
    },
    {
      key: 'confidence', header: 'Conf', sortable: true,
      accessor: (s) => Number(s.confidence),
      render: (s) => (
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(s.confidence))}%` }} />
          </div>
          <span className="text-[9px] font-mono text-white font-bold w-7 text-right">{Number(s.confidence).toFixed(0)}%</span>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (s) => {
        const badge = statusBadge[s.status] ?? statusBadge.pending
        return <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${badge}`}>{s.status}</span>
      },
    },
    {
      key: 'created_at', header: 'Date', sortable: true,
      accessor: (s) => new Date(s.created_at).getTime(),
      render: (s) => <span className="text-[9px] text-slate-500 font-mono">{new Date(s.created_at).toLocaleDateString()}</span>,
    },
  ]

  const toolbarContent = (
    <>
      <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      <FilterDropdown label="Direction" options={DIRECTION_OPTIONS} value={dirFilter} onChange={setDirFilter} />
    </>
  )

  return (
    <DataTable<Signal>
      data={filtered}
      columns={columns}
      rowKey={(s) => s.id}
      searchPlaceholder="Search pair…"
      pageSize={15}
      toolbar={toolbarContent}
      emptyMessage={signals.length === 0 ? 'No signals generated yet.' : 'No signals match your filters.'}
    />
  )
}
