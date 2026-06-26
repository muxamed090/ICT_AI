"use client"

import React, { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateProfile } from '@/actions/profileActions'
import { Profile } from '@/types/database'

interface ProfileFormProps {
  profile: Profile
}

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Tokyo', 'Asia/Hong_Kong', 'Asia/Dubai', 'Australia/Sydney']
const LANGUAGES = ['en', 'ar', 'es', 'fr', 'de', 'ja', 'zh']

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [timezone, setTimezone] = useState(profile.timezone)
  const [language, setLanguage] = useState(profile.language)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName || null,
        timezone,
        language,
      })

      if (result.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully.' })
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Update failed.' })
      }
    })
  }

  const inputClass = "w-full text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Full Name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Trader name…" />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Email</label>
        <input type="email" value={profile.email ?? ''} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        <p className="text-[9px] text-slate-600">Email cannot be changed here.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {feedback && (
        <p className={`text-[10px] font-mono ${feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {feedback.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save Changes
        </button>
      </div>
    </form>
  )
}
