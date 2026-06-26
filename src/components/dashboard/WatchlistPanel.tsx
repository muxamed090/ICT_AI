"use client"

import React, { useState, useTransition } from 'react'
import { Star, Trash2, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Watchlist } from '@/types/database'
import { addWatchlistItem, removeWatchlistItem, updateWatchlistItem } from '@/actions/watchlistActions'
import { useMarketData } from '@/lib/market/MarketDataProvider'
import { formatPrice, trendIcon, trendColor } from '@/lib/market/MarketDataUtils'
import DataTable, { DataTableColumn } from '@/components/common/DataTable'

const AVAILABLE_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD',
  'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'BTCUSD',
]

interface WatchlistPanelProps {
  initialItems: Watchlist[]
}

export default function WatchlistPanel({ initialItems }: WatchlistPanelProps) {
  const [items, setItems] = useState<Watchlist[]>(initialItems)
  const [addPair, setAddPair] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { getSymbol } = useMarketData()

  const existingPairs = new Set(items.map((w) => w.pair))
  const addablePairs = AVAILABLE_PAIRS.filter((p) => !existingPairs.has(p))

  function handleAdd() {
    if (!addPair) return
    setError(null)
    startTransition(async () => {
      const res = await addWatchlistItem({ pair: addPair, favorite: false, enabled: true, priority: items.length })
      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!])
        setAddPair('')
      } else {
        setError(res.error?.message ?? 'Failed to add pair')
      }
    })
  }

  function handleToggle(item: Watchlist) {
    startTransition(async () => {
      const res = await updateWatchlistItem(item.id, { enabled: !item.enabled })
      if (res.success && res.data) {
        setItems((prev) => prev.map((w) => w.id === item.id ? res.data! : w))
      }
    })
  }

  function handleFavorite(item: Watchlist) {
    startTransition(async () => {
      const res = await updateWatchlistItem(item.id, { favorite: !item.favorite })
      if (res.success && res.data) {
        setItems((prev) => prev.map((w) => w.id === item.id ? res.data! : w))
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removeWatchlistItem(id)
      if (res.success) {
        setItems((prev) => prev.filter((w) => w.id !== id))
      }
    })
  }

  const columns: DataTableColumn<Watchlist>[] = [
    {
      key: 'pair', header: 'Pair', sortable: true, searchable: true,
      render: (w) => <span className="font-bold text-white">{w.pair}</span>,
    },
    {
      key: 'bid', header: 'Live Bid',
      render: (w) => {
        const md = getSymbol(w.pair)
        return <span className="font-mono text-slate-300">{md ? formatPrice(md.bid, w.pair) : '—'}</span>
      },
    },
    {
      key: 'trend', header: 'Trend',
      render: (w) => {
        const md = getSymbol(w.pair)
        const trend = md ? trendIcon(md.trend) : '—'
        const color = md ? trendColor(md.trend) : 'text-slate-500'
        return <span className={`font-bold text-sm ${color}`}>{trend}</span>
      },
    },
    {
      key: 'enabled', header: 'Enabled',
      render: (w) => (
        <button onClick={() => handleToggle(w)} className="text-slate-400 hover:text-white transition-colors">
          {w.enabled
            ? <ToggleRight className="h-4 w-4 text-emerald-400" />
            : <ToggleLeft className="h-4 w-4 text-slate-600" />}
        </button>
      ),
    },
    {
      key: 'favorite', header: 'Fav',
      render: (w) => (
        <button onClick={() => handleFavorite(w)} className="text-slate-400 hover:text-amber-400 transition-colors">
          <Star className={`h-3.5 w-3.5 ${w.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
        </button>
      ),
    },
    {
      key: 'actions', header: '',
      render: (w) => (
        <button onClick={() => handleRemove(w.id)} disabled={isPending}
          className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30" aria-label={`Remove ${w.pair}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  const toolbarContent = (
    <div className="flex gap-2">
      <select value={addPair} onChange={(e) => setAddPair(e.target.value)}
        className="text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-2 text-slate-300 focus:outline-none focus:border-blue-500/40 transition-all">
        <option value="">+ Add Pair</option>
        {addablePairs.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <button onClick={handleAdd} disabled={!addPair || isPending}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40">
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
      </button>
    </div>
  )

  return (
    <div className="space-y-2">
      {error && <p className="text-[10px] text-rose-400 font-mono">{error}</p>}
      <DataTable<Watchlist>
        data={items}
        columns={columns}
        rowKey={(w) => w.id}
        searchPlaceholder="Search pairs…"
        pageSize={15}
        toolbar={toolbarContent}
        emptyMessage={items.length === 0 ? 'No pairs in watchlist. Add a pair above.' : 'No pairs match your search.'}
      />
    </div>
  )
}
