"use client"

import React, { useState, useTransition } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { createJournalEntry } from '@/actions/journalActions'
import { TradeJournal } from '@/types/database'
import JournalScreenshotUploader from './JournalScreenshotUploader'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'BTCUSD']
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']
const SESSIONS = ['asian', 'london', 'new_york_am', 'new_york_pm', 'london_close'] as const
const KILLZONES = ['asia', 'london', 'new_york', 'none'] as const
const SETUP_TYPES = ['BOS + OB', 'CHoCH + FVG', 'Liquidity Sweep', 'OTE Retracement', 'MSS', 'Custom']

interface JournalEntryFormProps {
  onClose: () => void
  onCreated: (entry: TradeJournal) => void
}

export default function JournalEntryForm({ onClose, onCreated }: JournalEntryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [pair, setPair] = useState(PAIRS[0])
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy')
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[4])
  const [session, setSession] = useState<typeof SESSIONS[number]>('london')
  const [killzone, setKillzone] = useState<typeof KILLZONES[number]>('london')
  const [setupType, setSetupType] = useState(SETUP_TYPES[0])
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [riskReward, setRiskReward] = useState('')
  const [notes, setNotes] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createJournalEntry({
        pair,
        direction,
        timeframe,
        session,
        killzone,
        setup_type: setupType,
        entry: parseFloat(entry),
        stop_loss: parseFloat(stopLoss),
        take_profit: parseFloat(takeProfit),
        risk_reward: parseFloat(riskReward),
        notes: notes || null,
        screenshot_url: screenshotUrl,
      })

      if (result.success && result.data) {
        onCreated(result.data)
      } else {
        setError(result.error?.message ?? 'Failed to create journal entry.')
      }
    })
  }

  const selectClass = "w-full text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/40 transition-all"
  const inputClass = selectClass
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-white/[0.06] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">New Trade Entry</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Pair, Direction, Timeframe */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Pair</label>
              <select value={pair} onChange={(e) => setPair(e.target.value)} className={selectClass}>
                {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Direction</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setDirection('buy')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                    direction === 'buy' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}>Buy</button>
                <button type="button" onClick={() => setDirection('sell')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                    direction === 'sell' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}>Sell</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={selectClass}>
                {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Session, Killzone, Setup */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Session</label>
              <select value={session} onChange={(e) => setSession(e.target.value as typeof session)} className={selectClass}>
                {SESSIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Killzone</label>
              <select value={killzone} onChange={(e) => setKillzone(e.target.value as typeof killzone)} className={selectClass}>
                {KILLZONES.map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Setup Type</label>
              <select value={setupType} onChange={(e) => setSetupType(e.target.value)} className={selectClass}>
                {SETUP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Entry, SL, TP, RR */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Entry</label>
              <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} className={inputClass} placeholder="1.08450" required />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Stop Loss</label>
              <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} placeholder="1.08200" required />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Take Profit</label>
              <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} placeholder="1.08900" required />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>R:R</label>
              <input type="number" step="any" value={riskReward} onChange={(e) => setRiskReward(e.target.value)} className={inputClass} placeholder="1.8" required />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className={labelClass}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className={`${inputClass} resize-none`} placeholder="Trade rationale, ICT confluence, observations…" />
          </div>

          {/* Screenshot */}
          <JournalScreenshotUploader value={screenshotUrl} onChange={setScreenshotUrl} />

          {/* Error */}
          {error && <p className="text-[10px] text-rose-400 font-mono">{error}</p>}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40">
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Log Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
