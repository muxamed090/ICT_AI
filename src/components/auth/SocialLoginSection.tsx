'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SocialLoginSection() {
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // No need to reset loading — browser will navigate away on success.
    // Reset on failure only:
    setGoogleLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]"></div>
        </div>
        <span className="relative bg-[#0B1220] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          Or continue with
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:border-white/[0.15] hover:text-white cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {googleLoading ? '...' : 'Google'}
        </button>
        <button
          type="button"
          disabled
          className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 opacity-60 cursor-not-allowed"
        >
          Apple
        </button>
        <button
          type="button"
          disabled
          className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 opacity-60 cursor-not-allowed"
        >
          Github
        </button>
      </div>
    </div>
  )
}
