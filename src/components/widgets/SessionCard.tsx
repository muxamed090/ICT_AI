"use client"

import React, { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getSessionState, formatCountdown, SessionState } from '@/lib/session/sessionEngine'

interface SessionCardProps {
  className?: string
}

export default function SessionCard({ className = '' }: SessionCardProps) {
  const [state, setState] = useState<SessionState>(() => getSessionState())
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const tick = () => {
      const newState = getSessionState()
      setState(newState)
      setCountdown(formatCountdown(newState.nextSessionStartsInMs))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const noSession = state.activeSessions.length === 0

  return (
    <div className={`glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-3 ${className}`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
        Market Sessions
      </p>

      {/* Active Sessions */}
      <div className="space-y-1.5">
        {noSession ? (
          <p className="text-xs text-slate-500">No active session (Weekend / Off Hours)</p>
        ) : (
          state.activeSessions.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className={`text-xs font-semibold ${s.color}`}>{s.name} Session</span>
              <span className="text-[9px] text-slate-500 font-mono ml-auto">ACTIVE</span>
            </div>
          ))
        )}
        {state.isOverlap && state.overlapLabel && (
          <div className="text-[10px] text-purple-400 font-semibold border-t border-white/[0.03] pt-1.5">
            ⚡ {state.overlapLabel}
          </div>
        )}
      </div>

      {/* Next Session */}
      {state.nextSession && (
        <div className="border-t border-white/[0.03] pt-2 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>Next: <span className={`font-semibold ${state.nextSession.color}`}>{state.nextSession.name}</span></span>
          </div>
          <span className="font-mono text-[10px] text-blue-400 font-semibold">{countdown}</span>
        </div>
      )}

      {/* UTC Clock */}
      <div className="text-[9px] text-slate-600 font-mono text-right">
        UTC {String(state.currentUtcHour).padStart(2, '0')}:{String(state.currentUtcMinute).padStart(2, '0')}
      </div>
    </div>
  )
}
