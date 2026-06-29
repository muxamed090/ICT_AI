import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EconomicEvent } from '@/types/database'
import PageTitle from '@/components/widgets/PageTitle'
import EconomicCalendarPanel from '@/components/dashboard/EconomicCalendarPanel'
import NewsWarningBanner from '@/components/news/NewsWarningBanner'
import TradingStatusCard from '@/components/news/TradingStatusCard'
import NewsCountdown from '@/components/news/NewsCountdown'

export const dynamic = 'force-dynamic'

export default async function EconomicCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let events: EconomicEvent[] = []
  try {
    const res = await fetch(
      'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      { cache: 'no-store' }
    )
    if (res.ok) {
      const raw = await res.json()
      events = raw.map((e: Record<string, string>, i: number) => ({
        id: `ff-${i}`,
        event_name: e.title ?? e.name ?? 'Unknown Event',
        currency: e.country ?? '',
        event_time: e.date ?? new Date().toISOString(),
        impact: e.impact?.toLowerCase() === 'high' ? 'high' : e.impact?.toLowerCase() === 'medium' ? 'medium' : 'low',
        forecast: e.forecast ?? null,
        previous: e.previous ?? null,
        actual: e.actual ?? null,
      }))
    }
  } catch {
    events = []
  }

  const highCount = events.filter((e) => e.impact === 'high').length
  const mediumCount = events.filter((e) => e.impact === 'medium').length
  const lowCount = events.filter((e) => e.impact === 'low').length
  const now = new Date()
  const upcomingCount = events.filter((e) => new Date(e.event_time) > now).length

  return (
    <div className="space-y-6">
      <PageTitle
        title="Economic Calendar"
        subtitle="Scheduled fundamental events that may impact market structure and liquidity."
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <NewsWarningBanner events={events} />
        </div>
        <TradingStatusCard events={events} />
        <NewsCountdown events={events} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: events.length, color: 'text-white' },
          { label: 'Upcoming', value: upcomingCount, color: 'text-blue-400' },
          { label: 'High Impact', value: highCount, color: 'text-rose-400' },
          { label: 'Medium Impact', value: mediumCount, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-1">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> HIGH: {highCount}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> MEDIUM: {mediumCount}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> LOW: {lowCount}
        </span>
      </div>

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <EconomicCalendarPanel events={events} />
      </div>
    </div>
  )
}