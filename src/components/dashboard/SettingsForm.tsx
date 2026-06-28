"use client"

import React, { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateSettings } from '@/actions/settingsActions'
import { testTelegramAction } from '@/actions/telegramActions'
import { UserSettings } from '@/types/database'

interface SettingsFormProps {
  settings: UserSettings
}

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Tokyo', 'Asia/Hong_Kong', 'Asia/Dubai', 'Australia/Sydney']
const LANGUAGES = ['en', 'ar', 'es', 'fr', 'de', 'ja', 'zh']
const ML_MODES = [
  { value: 'rules_only', label: 'Rules Only — ICT methodology strictly' },
  { value: 'hybrid', label: 'Hybrid — Rules + ML suggestions' },
  { value: 'ml_priority', label: 'ML Priority — AI-driven decisions' },
] as const

export default function SettingsForm({ settings }: SettingsFormProps) {
  const [timezone, setTimezone] = useState(settings.timezone)
  const [language, setLanguage] = useState(settings.language)
  const [riskPercent, setRiskPercent] = useState(String(settings.risk_percent))
  const [aiLearning, setAiLearning] = useState(settings.ai_learning_enabled)
  const [mlMode, setMlMode] = useState(settings.ml_mode)
  const [signalThreshold, setSignalThreshold] = useState(String(settings.signal_threshold ?? 7.00))
  const [maxSpreadAllowed, setMaxSpreadAllowed] = useState(String(settings.max_spread_allowed ?? 3.00))
  const [dailyDrawdownLimit, setDailyDrawdownLimit] = useState(String(settings.daily_drawdown_limit ?? 5.00))
  const [newsBufferMinutes, setNewsBufferMinutes] = useState(String(settings.news_buffer_minutes ?? 30))
  const [riskProfile, setRiskProfile] = useState<UserSettings['risk_profile']>(settings.risk_profile ?? 'balanced')
  const [notifEnabled, setNotifEnabled] = useState(settings.notification_enabled)
  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegram_enabled)
  const [telegramChatId, setTelegramChatId] = useState(settings.telegram_chat_id ?? '')
  const [isPending, startTransition] = useTransition()
  const [isTestingPending, startTestingTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleSendTestNotification(e: React.MouseEvent) {
    e.preventDefault()
    setFeedback(null)
    startTestingTransition(async () => {
      const result = await testTelegramAction()
      if (result.success) {
        setFeedback({ type: 'success', message: 'Test notification sent successfully.' })
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Failed to send test notification.' })
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    startTransition(async () => {
      const result = await updateSettings({
        theme: settings.theme,
        timezone,
        language,
        notification_enabled: notifEnabled,
        telegram_enabled: telegramEnabled,
        telegram_chat_id: telegramChatId || null,
        risk_percent: parseFloat(riskPercent) || 1.0,
        ai_learning_enabled: aiLearning,
        ml_mode: mlMode,
        signal_threshold: parseFloat(signalThreshold) || 7.00,
        max_spread_allowed: parseFloat(maxSpreadAllowed) || 3.00,
        daily_drawdown_limit: parseFloat(dailyDrawdownLimit) || 5.00,
        news_buffer_minutes: parseInt(newsBufferMinutes) || 30,
        risk_profile: riskProfile
      })

      if (result.success) {
        setFeedback({ type: 'success', message: 'Settings saved successfully.' })
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Save failed.' })
      }
    })
  }

  const inputClass = "w-full text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest"
  const sectionClass = "space-y-4 pb-6 border-b border-white/[0.04]"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Preferences */}
      <div className={sectionClass}>
        <p className="text-xs font-bold text-white">General Preferences</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Theme</label>
            <input type="text" value="Dark" disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
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
      </div>

      {/* Risk Management */}
      <div className={sectionClass}>
        <p className="text-xs font-bold text-white">Risk Management & Boundaries</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Risk Per Trade (%)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className={inputClass}
              placeholder="1.00"
            />
            <p className="text-[9px] text-slate-600">Base percentage of account equity risked per entry.</p>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Risk Profile</label>
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value as UserSettings['risk_profile'])}
              className={inputClass}
            >
              <option value="conservative">Conservative (0.5x Risk)</option>
              <option value="balanced">Balanced (1.0x Risk)</option>
              <option value="aggressive">Aggressive (1.5x Risk)</option>
            </select>
            <p className="text-[9px] text-slate-600">Scales the position sizing calculator multipliers.</p>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Max Spread Allowed (Pips)</label>
            <input
              type="number"
              step="0.1"
              min="0.0"
              value={maxSpreadAllowed}
              onChange={(e) => setMaxSpreadAllowed(e.target.value)}
              className={inputClass}
              placeholder="3.0"
            />
            <p className="text-[9px] text-slate-600">Maximum spread allowed before entry is locked.</p>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Daily Drawdown Limit (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100.0"
              value={dailyDrawdownLimit}
              onChange={(e) => setDailyDrawdownLimit(e.target.value)}
              className={inputClass}
              placeholder="5.0"
            />
            <p className="text-[9px] text-slate-600">Daily account equity loss protection lockout.</p>
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label className={labelClass}>News Lockout Buffer (Minutes)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={newsBufferMinutes}
            onChange={(e) => setNewsBufferMinutes(e.target.value)}
            className={inputClass}
            placeholder="30"
          />
          <p className="text-[9px] text-slate-600">Lock trading before & after high-impact events.</p>
        </div>
      </div>

      {/* AI Engine */}
      <div className={sectionClass}>
        <p className="text-xs font-bold text-white">AI Engine Configuration</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>AI Learning</label>
            <button type="button" onClick={() => setAiLearning(!aiLearning)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                aiLearning
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
              }`}>
              <span>Adaptive Learning</span>
              <span>{aiLearning ? 'ENABLED' : 'DISABLED'}</span>
            </button>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>ML Mode</label>
            <select value={mlMode} onChange={(e) => setMlMode(e.target.value as typeof mlMode)} className={inputClass}>
              {ML_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Signal Threshold (0-10)</label>
            <input
              type="number"
              step="0.1"
              min="0.0"
              max="10.0"
              value={signalThreshold}
              onChange={(e) => setSignalThreshold(e.target.value)}
              className={inputClass}
              placeholder="7.0"
            />
          </div>
        </div>
      </div>

      {/* Notifications & Telegram */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-white">Notifications & Integrations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>Push Notifications</label>
            <button type="button" onClick={() => setNotifEnabled(!notifEnabled)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                notifEnabled
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
              }`}>
              <span>In-App Alerts</span>
              <span>{notifEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Telegram Bot</label>
            <button type="button" onClick={() => setTelegramEnabled(!telegramEnabled)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                telegramEnabled
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
              }`}>
              <span>Telegram Alerts</span>
              <span>{telegramEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {telegramEnabled && (
          <div className="space-y-1.5 max-w-sm">
            <label className={labelClass}>Telegram Chat ID</label>
            <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} className={inputClass} placeholder="Enter Telegram chat ID" />
            <p className="text-[9px] text-slate-600 mb-2">Found via @userinfobot on Telegram.</p>
            <button
              type="button"
              disabled={isTestingPending}
              onClick={handleSendTestNotification}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40"
            >
              {isTestingPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isTestingPending ? 'Sending...' : 'Send Test Notification'}
            </button>
          </div>
        )}
      </div>

      {/* Feedback & Submit */}
      {feedback && (
        <p className={`text-[10px] font-mono ${feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {feedback.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save Settings
        </button>
      </div>
    </form>
  )
}
