import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ValidationMessageProps {
  type: 'error' | 'success'
  message: string | null
}

export default function ValidationMessage({ type, message }: ValidationMessageProps) {
  if (!message) return null

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 ${
        type === 'error'
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      }`}
    >
      {type === 'error' ? (
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
      )}
      <span>{message}</span>
    </div>
  )
}
