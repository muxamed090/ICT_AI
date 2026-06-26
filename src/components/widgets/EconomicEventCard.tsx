import React from 'react'
import { EconomicEvent } from '@/types/database'
import { Calendar } from 'lucide-react'
import CountdownTimer from './CountdownTimer'

interface EconomicEventCardProps {
  event: EconomicEvent
  showCountdown?: boolean
}

const impactConfig = {
  high: { label: 'HIGH', bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  medium: { label: 'MED', bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  low: { label: 'LOW', bg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
}

export default function EconomicEventCard({ event, showCountdown = true }: EconomicEventCardProps) {
  const impact = impactConfig[event.impact] ?? impactConfig.low
  const eventTime = new Date(event.event_time)
  const isPast = eventTime < new Date()
  const formattedTime = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC'

  return (
    <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-white leading-snug truncate">{event.event_name}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${impact.bg}`}>
              {impact.label} IMPACT
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              {event.currency}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-mono">
            <Calendar className="h-3 w-3 text-slate-500" />
            {formattedTime}
          </p>
          {showCountdown && !isPast && (
            <CountdownTimer targetIso={event.event_time} label="In:" className="text-blue-400" />
          )}
          {isPast && (
            <span className="text-[10px] text-slate-500 font-mono">Released</span>
          )}
        </div>
      </div>

      {(event.forecast || event.previous || event.actual) && (
        <div className="flex gap-4 text-[9px] font-mono text-slate-400 border-t border-white/[0.03] pt-2">
          {event.forecast && (
            <span>FCST: <span className="text-slate-300 font-semibold">{event.forecast}</span></span>
          )}
          {event.previous && (
            <span>PREV: <span className="text-slate-300 font-semibold">{event.previous}</span></span>
          )}
          {event.actual && (
            <span>ACT: <span className="text-emerald-400 font-semibold">{event.actual}</span></span>
          )}
        </div>
      )}
    </div>
  )
}
