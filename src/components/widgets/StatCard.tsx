import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  glow?: boolean
}

export default function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  subtitle,
  glow = false
}: StatCardProps) {
  return (
    <div
      className={`glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20 relative overflow-hidden transition-all duration-300 hover:border-white/[0.08] ${
        glow ? 'shadow-premium-glow' : ''
      }`}
    >
      {glow && (
        <div className="absolute -right-10 -top-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
        {title}
      </p>

      <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-3 tracking-tight font-mono leading-none">
        {value}
      </h4>

      {(change || subtitle) && (
        <div className="flex items-center gap-1.5 mt-3 text-xs leading-none">
          {change && (
            <span
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                trend === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : trend === 'down'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
          )}
          {subtitle && <span className="text-[10px] text-slate-500 font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
