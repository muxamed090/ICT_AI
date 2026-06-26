"use client"

import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { EconomicEvent } from '@/types/database'
import { evaluateTradingStatus, TradingStatusResult } from '@/lib/news/newsFilterEngine'

interface TradingStatusCardProps {
  events: EconomicEvent[]
}

export default function TradingStatusCard({ events }: TradingStatusCardProps) {
  const [status, setStatus] = useState<TradingStatusResult>(() => evaluateTradingStatus(events))

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(evaluateTradingStatus(events))
    }, 30000)
    return () => clearInterval(interval)
  }, [events])

  if (!status.isBlocked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          Trading Permitted
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25">
      <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
          Trading Blocked — High Impact News
        </p>
        <p className="text-[9px] text-slate-400 leading-snug truncate">{status.reason}</p>
        {status.minutesUntilClear !== null && (
          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
            <Clock className="h-2.5 w-2.5" />
            Clear in ~{status.minutesUntilClear} min
          </div>
        )}
      </div>
    </div>
  )
}
