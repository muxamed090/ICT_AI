"use client"

import React, { useState } from 'react'
import { useMarketData } from '@/lib/market/MarketDataProvider'
import { getAllPairStatuses } from '@/lib/market/marketStatusEngine'
import MarketCard from '@/components/widgets/MarketCard'
import PairCard from '@/components/widgets/PairCard'
import SessionCard from '@/components/widgets/SessionCard'
import SearchBar from '@/components/common/SearchBar'
import FilterDropdown from '@/components/common/FilterDropdown'

const VOLATILITY_OPTIONS = [
  { value: 'all', label: 'All Volatility' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const TREND_OPTIONS_FILTER = [
  { value: 'all', label: 'All Trends' },
  { value: 'up', label: 'Bullish ▲' },
  { value: 'down', label: 'Bearish ▼' },
  { value: 'neutral', label: 'Neutral —' },
]

const VIEW_OPTIONS = [
  { value: 'cards', label: 'Cards' },
  { value: 'compact', label: 'Compact' },
]

export default function MarketOverviewClient() {
  const { data } = useMarketData()
  const statuses = getAllPairStatuses()
  const statusMap = Object.fromEntries(statuses.map((s) => [s.symbol, s.status]))

  const [search, setSearch] = useState('')
  const [volatilityFilter, setVolatilityFilter] = useState('all')
  const [trendFilter, setTrendFilter] = useState('all')
  const [view, setView] = useState('cards')

  const filtered = data.filter((d) => {
    const matchesSearch = d.symbol.toLowerCase().includes(search.toLowerCase())
    const matchesVol = volatilityFilter === 'all' || d.volatility === volatilityFilter
    const matchesTrend = trendFilter === 'all' || d.trend === trendFilter
    return matchesSearch && matchesVol && matchesTrend
  })

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
          Live Market Data
        </span>
        <span className="text-[9px] text-slate-600 font-mono ml-auto">
          {filtered.length} of {data.length} pairs
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search symbol…" className="flex-1 min-w-[160px]" />
        <FilterDropdown label="Vol" options={VOLATILITY_OPTIONS} value={volatilityFilter} onChange={setVolatilityFilter} />
        <FilterDropdown label="Trend" options={TREND_OPTIONS_FILTER} value={trendFilter} onChange={setTrendFilter} />
        <FilterDropdown label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
      </div>

      {/* Session + Data grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Session panel */}
        <div className="lg:col-span-3">
          <SessionCard />
        </div>

        {/* Market grid */}
        <div className="lg:col-span-9">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No pairs match your filters.
            </div>
          ) : view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((d) => (
                <MarketCard key={d.symbol} data={d} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((d) => (
                <PairCard key={d.symbol} data={d} status={statusMap[d.symbol] ?? 'Neutral'} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
