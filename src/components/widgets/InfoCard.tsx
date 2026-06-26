import React from 'react'

interface InfoCardProps {
  title: string
  items: { label: string; value: string; highlight?: boolean }[]
}

export default function InfoCard({ title, items }: InfoCardProps) {
  return (
    <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
        {title}
      </p>
      <div className="space-y-3 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-white/[0.02] pb-1.5 last:border-0 last:pb-0">
            <span className="text-slate-400 font-medium">{item.label}</span>
            <span className={`font-mono font-semibold ${item.highlight ? 'text-blue-400' : 'text-slate-200'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
