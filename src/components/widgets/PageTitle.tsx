import React from 'react'

const BADGE_COLORS: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

interface PageTitleProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet'
}

export default function PageTitle({ title, subtitle, badge, badgeColor = 'blue' }: PageTitleProps) {
  const badgeClass = BADGE_COLORS[badgeColor] ?? BADGE_COLORS.blue
  return (
    <div className="mb-6 space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs sm:text-sm text-slate-400 font-medium">{subtitle}</p>}
    </div>
  )
}
