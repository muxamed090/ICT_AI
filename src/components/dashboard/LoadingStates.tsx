import React from 'react'

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-48 w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20 space-y-4 animate-pulse">
      <div className="h-3.5 w-1/4 bg-slate-800 rounded"></div>
      <div className="h-8 w-3/4 bg-slate-800 rounded"></div>
      <div className="h-4 w-1/2 bg-slate-800 rounded mt-2"></div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20 space-y-4 animate-pulse">
      <div className="h-4 w-1/3 bg-slate-800 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-10 bg-slate-800/60 rounded"></div>
        <div className="h-10 bg-slate-800/60 rounded"></div>
        <div className="h-10 bg-slate-800/60 rounded"></div>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-white/10 bg-white/[0.01] min-h-[200px]">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
