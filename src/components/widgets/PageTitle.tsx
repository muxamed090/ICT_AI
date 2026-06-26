import React from 'react'

interface PageTitleProps {
  title: string
  subtitle?: string
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {subtitle && <p className="text-xs sm:text-sm text-slate-400 font-medium">{subtitle}</p>}
    </div>
  )
}
