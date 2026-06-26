import React, { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`w-full bg-[#0E1628]/80 border ${
              error 
                ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' 
                : 'border-white/[0.08] focus:border-blue-500 focus:ring-blue-500/20'
            } rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
        {error && <p className="text-[11px] text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
