import React from 'react'

interface ActivityItem {
  id: string | number
  title: string
  subtitle: string
  time: string
  badgeText?: string
  badgeColor?: 'green' | 'blue' | 'purple' | 'red' | 'neutral'
}

interface ActivityCardProps {
  title: string
  items: ActivityItem[]
}

export default function ActivityCard({ title, items }: ActivityCardProps) {
  return (
    <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
        {title}
      </p>
      
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">No recent activity detected.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-3 border-b border-white/[0.02] pb-2.5 last:border-0 last:pb-0">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[9px] text-slate-500 font-mono font-medium">{item.time}</span>
                {item.badgeText && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    item.badgeColor === 'green' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.badgeColor === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                    item.badgeColor === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                    item.badgeColor === 'red' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-white/5 text-slate-400'
                  }`}>
                    {item.badgeText}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
