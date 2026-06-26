"use client"

import React, { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetIso: string
  label?: string
  className?: string
}

export default function CountdownTimer({ targetIso, label, className = '' }: CountdownTimerProps) {
  const [msLeft, setMsLeft] = useState(0)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now()
      setMsLeft(Math.max(0, diff))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetIso])

  const totalSec = Math.floor(msLeft / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const formatted = [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')

  return (
    <span className={`font-mono text-xs font-semibold ${className}`}>
      {label && <span className="text-slate-400 font-normal mr-1">{label}</span>}
      {msLeft <= 0 ? (
        <span className="text-slate-500">Completed</span>
      ) : (
        formatted
      )}
    </span>
  )
}
