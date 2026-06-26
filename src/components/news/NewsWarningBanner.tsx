"use client"

import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { EconomicEvent } from '@/types/database'
import { evaluateTradingStatus } from '@/lib/news/newsFilterEngine'

interface NewsWarningBannerProps {
  events: EconomicEvent[]
}

export default function NewsWarningBanner({ events }: NewsWarningBannerProps) {
  const [blocked, setBlocked] = useState(() => evaluateTradingStatus(events))

  useEffect(() => {
    const interval = setInterval(() => {
      setBlocked(evaluateTradingStatus(events))
    }, 15000)
    return () => clearInterval(interval)
  }, [events])

  if (!blocked.isBlocked) return null

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 animate-pulse-slow">
      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-rose-400 leading-none">
          ⚠️ High-Impact News Window — Trading Disabled
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
          {blocked.reason}
          {blocked.minutesUntilClear !== null && ` · Clear in ~${blocked.minutesUntilClear} min`}
        </p>
      </div>
      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
    </div>
  )
}
