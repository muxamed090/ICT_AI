import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Signal } from '@/types/database'
import PageTitle from '@/components/widgets/PageTitle'
import StatCard from '@/components/widgets/StatCard'
import SignalsPanel from '@/components/dashboard/SignalsPanel'
import { GET } from '@/app/api/signals/generate/route'

export const dynamic = 'force-dynamic'

interface GeneratedSignal {
  pair: string
  direction: 'buy' | 'sell'
  price: number
  entry: number
  stop_loss: number
  tp1: number
  tp2: number
  score: number
  confidence: number
  recommendation: string
  hasNewsRisk: boolean
  newsWarning: string | null
}

interface UpcomingNews {
  title: string
  country: string
  impact: string
  date: string
  minutesUntil: number
}

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let generated: GeneratedSignal[] = []
  let upcomingHighNews: UpcomingNews[] = []

  try {

    const res = await GET()
    const data = await res.json()
    generated = data.signals ?? []
    upcomingHighNews = data.upcomingHighNews ?? []
  } catch (err) {
    console.error('Signal fetch error:', err)
    generated = []
  }

  const signals = generated.map((s, i) => ({
    id: `live-${i}`,
    user_id: user.id,
    pair: s.pair,
    direction: s.direction,
    entry: s.entry,
    entry_price: s.entry,
    stop_loss: s.stop_loss,
    tp1: s.tp1,
    tp2: s.tp2,
    take_profit_1: s.tp1,
    take_profit_2: s.tp2,
    score: s.score,
    confidence: s.confidence,
    status: (s.recommendation === 'ENTRY' ? 'active' : 'pending') as 'active' | 'pending' | 'completed' | 'expired',
    created_at: new Date().toISOString(),
  }))
  const totalSignals = signals.length
  const activeCount = generated.filter((s) => s.recommendation === 'ENTRY').length
  const pendingCount = generated.filter((s) => s.recommendation === 'WATCH' || s.recommendation === 'WAIT').length
  const avgConfidence = totalSignals ? generated.reduce((a, s) => a + s.confidence, 0) / totalSignals : 0
  const avgScore = totalSignals ? generated.reduce((a, s) => a + s.score, 0) / totalSignals : 0

  return (
    <div className="space-y-6">
      <PageTitle
        title="Signal Intelligence"
        subtitle="AI-generated trade signals with score, confidence, and entry-level parameters."
      />

      {upcomingHighNews.length > 0 && (
        <div className="glass-panel rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">⚠️ High Impact News Approaching</p>
          {upcomingHighNews.map((n, i) => (
            <p key={i} className="text-[11px] text-slate-300 font-mono">
              {n.title} ({n.country}) — in {n.minutesUntil} min
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Signals"
          value={totalSignals.toString()}
          change={`${activeCount} active`}
          trend={activeCount > 0 ? 'up' : 'neutral'}
          subtitle={`${pendingCount} pending`}
        />
        <StatCard
          title="Completed"
          value="0"
          change="live feed"
          trend="neutral"
        />
        <StatCard
          title="Avg Confidence"
          value={`${avgConfidence.toFixed(1)}%`}
          change={avgConfidence >= 70 ? 'Strong' : avgConfidence >= 50 ? 'Moderate' : 'Low'}
          trend={avgConfidence >= 70 ? 'up' : avgConfidence >= 50 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Avg Score"
          value={avgScore.toFixed(1)}
          change={`${totalSignals} samples`}
          trend={avgScore >= 70 ? 'up' : 'neutral'}
        />
      </div>

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <SignalsPanel signals={signals} />
      </div>
    </div>
  )
}