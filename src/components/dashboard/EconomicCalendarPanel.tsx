"use client"

import React, { useState } from 'react'
import { EconomicEvent } from '@/types/database'
import EconomicEventCard from '@/components/widgets/EconomicEventCard'
import FilterDropdown from '@/components/common/FilterDropdown'
import SearchBar from '@/components/common/SearchBar'

interface EconomicCalendarPanelProps {
  events: EconomicEvent[]
}

const IMPACT_OPTIONS = [
  { value: 'all', label: 'All Impacts' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const SORT_OPTIONS = [
  { value: 'time_asc', label: 'Time ↑' },
  { value: 'time_desc', label: 'Time ↓' },
  { value: 'impact', label: 'Impact' },
]

export default function EconomicCalendarPanel({ events }: EconomicCalendarPanelProps) {
  const [search, setSearch] = useState('')
  const [impactFilter, setImpactFilter] = useState('all')
  const [sortBy, setSortBy] = useState('time_asc')

  const now = new Date()

  let filtered = events.filter((e) => {
    const matchesSearch =
      e.event_name.toLowerCase().includes(search.toLowerCase()) ||
      e.currency.toLowerCase().includes(search.toLowerCase())
    const matchesImpact = impactFilter === 'all' || e.impact === impactFilter
    return matchesSearch && matchesImpact
  })

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'time_asc') return new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
    if (sortBy === 'time_desc') return new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
    // impact sort: high > medium > low
    const impactRank = { high: 3, medium: 2, low: 1 } as Record<string, number>
    return (impactRank[b.impact] ?? 0) - (impactRank[a.impact] ?? 0)
  })

  const upcoming = filtered.filter((e) => new Date(e.event_time) > now)
  const past = filtered.filter((e) => new Date(e.event_time) <= now)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search events or currency…"
          className="flex-1 min-w-[200px]"
        />
        <FilterDropdown
          label="Impact"
          options={IMPACT_OPTIONS}
          value={impactFilter}
          onChange={setImpactFilter}
        />
        <FilterDropdown
          label="Sort"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
        />
      </div>

      {/* Count summary */}
      <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
        <span>{upcoming.length} upcoming</span>
        <span>·</span>
        <span>{past.length} released</span>
        <span>·</span>
        <span>{filtered.length} total</span>
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Upcoming</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map((event) => (
              <EconomicEventCard key={event.id} event={event} showCountdown />
            ))}
          </div>
        </div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Released</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
            {past.map((event) => (
              <EconomicEventCard key={event.id} event={event} showCountdown={false} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No economic events match your filters.
        </div>
      )}
    </div>
  )
}
