"use client"

import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { EconomicEvent } from '@/types/database'
import { getNextHighImpactEvent } from '@/lib/news/newsFilterEngine'

interface NewsCountdownProps {
  events: EconomicEvent[]
}

function msToHms(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function NewsCountdown({ events }: NewsCountdownProps) {
  const [nextEvent, setNextEvent] = useState<EconomicEvent | null>(() => getNextHighImpactEvent(events))
  const [msLeft, setMsLeft] = useState(0)

  useEffect(() => {
    const found = getNextHighImpactEvent(events)
    setNextEvent(found)
  }, [events])

  useEffect(() => {
    if (!nextEvent) return
    const tick = () => {
      setMsLeft(Math.max(0, new Date(nextEvent.event_time).getTime() - Date.now()))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [nextEvent])

  if (!nextEvent) return null

  const isImminent = msLeft < 30 * 60 * 1000

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono border ${
      isImminent
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    }`}>
      <AlertTriangle className={`h-3 w-3 shrink-0 ${isImminent ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
      <span className="font-bold">{msToHms(msLeft)}</span>
      <span className="text-slate-400 truncate">
        until {nextEvent.event_name} ({nextEvent.currency})
      </span>
    </div>
  )
}
