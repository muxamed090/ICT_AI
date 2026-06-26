import React from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4 border-b border-white/[0.03] pb-2">
      <div className="space-y-0.5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{title}</h3>
        {description && <p className="text-[10px] text-slate-400 font-medium">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
