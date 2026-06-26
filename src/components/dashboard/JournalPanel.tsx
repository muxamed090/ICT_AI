"use client"

import React, { useState, useTransition } from 'react'
import { Trash2, Plus, Loader2, ImageIcon } from 'lucide-react'
import { TradeJournal } from '@/types/database'
import { updateJournalEntry, deleteJournalEntry } from '@/actions/journalActions'
import DataTable, { DataTableColumn } from '@/components/common/DataTable'
import FilterDropdown from '@/components/common/FilterDropdown'
import JournalEntryForm from './JournalEntryForm'

const RESULT_FILTER = [
  { value: 'all', label: 'All Results' },
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'breakeven', label: 'Breakeven' },
  { value: 'pending', label: 'Pending' },
]

const SESSION_FILTER = [
  { value: 'all', label: 'All Sessions' },
  { value: 'asian', label: 'Asian' },
  { value: 'london', label: 'London' },
  { value: 'new_york_am', label: 'NY AM' },
  { value: 'new_york_pm', label: 'NY PM' },
  { value: 'london_close', label: 'London Close' },
]

const resultBadge: Record<string, string> = {
  win: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  loss: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  breakeven: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

interface JournalPanelProps {
  initialTrades: TradeJournal[]
}

export default function JournalPanel({ initialTrades }: JournalPanelProps) {
  const [trades, setTrades] = useState<TradeJournal[]>(initialTrades)
  const [resultFilter, setResultFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Inline result update
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editResult, setEditResult] = useState('win')
  const [editPnl, setEditPnl] = useState('')

  // External filters applied before DataTable receives data
  const filtered = trades
    .filter((t) => resultFilter === 'all' || t.result === resultFilter)
    .filter((t) => sessionFilter === 'all' || t.session === sessionFilter)

  function handleInlineUpdate(id: string) {
    startTransition(async () => {
      const result = await updateJournalEntry(id, { result: editResult, pnl: parseFloat(editPnl) || 0 })
      if (result.success && result.data) {
        setTrades((prev) => prev.map((t) => t.id === id ? result.data! : t))
      }
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteJournalEntry(id)
      if (result.success) setTrades((prev) => prev.filter((t) => t.id !== id))
    })
  }

  function handleCreated(entry: TradeJournal) {
    setTrades((prev) => [entry, ...prev])
    setShowForm(false)
  }

  const columns: DataTableColumn<TradeJournal>[] = [
    {
      key: 'pair', header: 'Pair', sortable: true, searchable: true,
      render: (t) => <span className="font-bold text-white">{t.pair}</span>,
    },
    {
      key: 'direction', header: 'Dir',
      render: (t) => (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
          t.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>{t.direction}</span>
      ),
    },
    {
      key: 'session', header: 'Session',
      render: (t) => <span className="text-slate-400 text-[10px]">{t.session.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'setup_type', header: 'Setup',
      render: (t) => <span className="text-slate-400 text-[10px]">{t.setup_type}</span>,
    },
    {
      key: 'entry', header: 'Entry / SL / TP',
      render: (t) => (
        <span className="font-mono text-[10px] text-slate-300">
          {Number(t.entry).toFixed(5)}<br />
          <span className="text-slate-500">SL {Number(t.stop_loss).toFixed(5)} · TP {Number(t.take_profit).toFixed(5)}</span>
        </span>
      ),
    },
    {
      key: 'risk_reward', header: 'R:R', sortable: true,
      accessor: (t) => Number(t.risk_reward),
      render: (t) => <span className="font-mono text-slate-300">{Number(t.risk_reward).toFixed(1)}</span>,
    },
    {
      key: 'result', header: 'Result',
      render: (t) => {
        const isEditing = editingId === t.id
        const badge = resultBadge[t.result] ?? resultBadge.pending

        if (isEditing) {
          return (
            <div className="flex gap-1">
              <select value={editResult} onChange={(e) => setEditResult(e.target.value)}
                className="text-[9px] bg-white/[0.04] border border-white/[0.07] rounded px-1 py-0.5 text-white">
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">BE</option>
              </select>
              <input type="number" step="any" value={editPnl} onChange={(e) => setEditPnl(e.target.value)}
                className="w-16 text-[9px] bg-white/[0.04] border border-white/[0.07] rounded px-1 py-0.5 text-white" placeholder="P&L" />
              <button onClick={() => handleInlineUpdate(t.id)} disabled={isPending}
                className="text-[9px] px-1.5 rounded bg-blue-600/20 text-blue-400 font-bold hover:bg-blue-600/30 disabled:opacity-40">
                {isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : 'OK'}
              </button>
            </div>
          )
        }

        return (
          <button onClick={() => { setEditingId(t.id); setEditResult(t.result); setEditPnl(String(t.pnl || '')) }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${badge} hover:opacity-80 transition-opacity`}>
            {t.result}
          </button>
        )
      },
    },
    {
      key: 'pnl', header: 'P&L', sortable: true,
      accessor: (t) => Number(t.pnl || 0),
      render: (t) => {
        const val = Number(t.pnl || 0)
        return <span className={`font-mono font-bold ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{val >= 0 ? '+' : ''}{val.toFixed(2)}</span>
      },
    },
    {
      key: 'screenshot', header: 'Img',
      render: (t) => t.screenshot_url
        ? <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300"><ImageIcon className="h-3.5 w-3.5" /></a>
        : <span className="text-slate-600">—</span>,
    },
    {
      key: 'created_at', header: 'Date', sortable: true,
      accessor: (t) => new Date(t.created_at).getTime(),
      render: (t) => <span className="text-[9px] text-slate-500 font-mono">{new Date(t.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions', header: '',
      render: (t) => (
        <button onClick={() => handleDelete(t.id)} disabled={isPending}
          className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30" aria-label={`Delete ${t.pair}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  const toolbarContent = (
    <>
      <FilterDropdown label="Result" options={RESULT_FILTER} value={resultFilter} onChange={setResultFilter} />
      <FilterDropdown label="Session" options={SESSION_FILTER} value={sessionFilter} onChange={setSessionFilter} />
      <button onClick={() => setShowForm(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all">
        <Plus className="h-3 w-3" /> New Trade
      </button>
    </>
  )

  return (
    <>
      <DataTable<TradeJournal>
        data={filtered}
        columns={columns}
        rowKey={(t) => t.id}
        searchPlaceholder="Search pair…"
        pageSize={15}
        toolbar={toolbarContent}
        emptyMessage={trades.length === 0 ? 'No trades logged yet. Click "New Trade" to start.' : 'No trades match your filters.'}
      />
      {showForm && <JournalEntryForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}
    </>
  )
}
