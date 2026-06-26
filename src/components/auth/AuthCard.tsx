import React from 'react'

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-premium border border-white/[0.06] bg-slate-950/40 backdrop-blur-xl">
      {children}
    </div>
  )
}
