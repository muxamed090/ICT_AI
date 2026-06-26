"use client"

import React, { useRef, useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function FilterDropdown({ label, options, value, onChange, className = '' }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg text-slate-300 hover:border-white/[0.12] hover:text-white transition-all"
      >
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}:</span>
        <span className="font-semibold">{selected?.label ?? 'All'}</span>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] glass-panel rounded-xl border border-white/[0.08] bg-slate-900/95 py-1 shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/[0.05] transition-colors text-left ${
                opt.value === value ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="h-3 w-3 text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
