"use client"

import React, { useState, useTransition } from 'react'
import { Star, Trash2, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Watchlist } from '@/types/database'
import { addWatchlistItem, removeWatchlistItem, updateWatchlistItem } from '@/actions/watchlistActions'
import { useMarketData } from '@/lib/market/MarketDataProvider'
import { formatPrice, trendIcon, trendColor } from '@/lib/market/MarketDataUtils'
import SearchBar from '@/components/common/SearchBar'

const AVAILABLE_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD',
  'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'BTCUSD',
]

interface WatchlistPanelProps {
  initialItems: Watchlist[]
}

export default function WatchlistPanel({ initialItems }: WatchlistPanelProps) {
  const [items, setItems] = useState<Watchlist[]>(initialItems)
  const [search, setSearch] = useState('')
  const [addPair, setAddPair] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { getSymbol } = useMarketData()

  const filtered = items.filter((w) =>
    w.pair.toLowerCase().includes(search.toLowerCase())
  )

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search pairs…" className="flex-1 min-w-[180px]" />
        <div className="flex gap-2">
          <select
            value={addPair}
            onChange={(e) => setAddPair(e.target.value)}
            className="text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-2 text-slate-300 focus:outline-none focus:border-blue-500/40 transition-all"
          >
            <option value="">+ Add Pair</option>
            {addablePairs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!addPair || isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-rose-400 font-mono">{error}</p>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          {items.length === 0 ? 'No pairs in watchlist. Add a pair above.' : 'No pairs match your search.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 pr-3">Pair</th>
                <th className="py-2.5 pr-3">Live Bid</th>
                <th className="py-2.5 pr-3">Trend</th>
                <th className="py-2.5 pr-3 text-center">Enabled</th>
                <th className="py-2.5 pr-3 text-center">Fav</th>
                <th className="py-2.5 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((item) => {
                const marketData = getSymbol(item.pair)
                const trend = marketData ? trendIcon(marketData.trend) : '—'
                const tColor = marketData ? trendColor(marketData.trend) : 'text-slate-500'
                return (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 pr-3 font-bold text-white">{item.pair}</td>
                    <td className="py-3 pr-3 font-mono text-slate-300">
                      {marketData ? formatPrice(marketData.bid, item.pair) : '—'}
                    </td>
                    <td className={`py-3 pr-3 font-bold text-sm ${tColor}`}>{trend}</td>
                    <td className="py-3 pr-3 text-center">
                      <button onClick={() => handleToggle(item)} className="text-slate-400 hover:text-white transition-colors">
                        {item.enabled
                          ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                          : <ToggleLeft className="h-4 w-4 text-slate-600" />}
                      </button>
                    </td>
                    <td className="py-3 pr-3 text-center">
                      <button onClick={() => handleFavorite(item)} className="text-slate-400 hover:text-amber-400 transition-colors">
                        <Star className={`h-3.5 w-3.5 ${item.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isPending}
                        className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30"
                        aria-label={`Remove ${item.pair}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[9px] text-slate-600 font-mono">
        {items.length} pair{items.length !== 1 ? 's' : ''} in watchlist
      </p>
    </div>
  )
}
