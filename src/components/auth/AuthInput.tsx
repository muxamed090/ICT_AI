import React, { InputHTMLAttributes, forwardRef } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type = 'text', className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          {label}
        </label>
        <input
          ref={ref}
          type={type}
          className={`w-full bg-[#0E1628]/80 border ${
            error 
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' 
              : 'border-white/[0.08] focus:border-blue-500 focus:ring-blue-500/20'
          } rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
