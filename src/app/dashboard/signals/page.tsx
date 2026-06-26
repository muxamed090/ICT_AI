import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignalRepository } from '@/lib/repositories/SignalRepository'
import { computeSignalStats } from '@/lib/services/SignalStatsService'
import PageTitle from '@/components/widgets/PageTitle'
import StatCard from '@/components/widgets/StatCard'
import SignalsPanel from '@/components/dashboard/SignalsPanel'

export const dynamic = 'force-dynamic'

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const signalRepo = new SignalRepository(supabase)
  const signals = await signalRepo.getAll(user.id)
  const stats = computeSignalStats(signals)

  return (
    <div className="space-y-6">
      <PageTitle
        title="Signal Intelligence"
        subtitle="AI-generated trade signals with score, confidence, and entry-level parameters."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Signals"
          value={stats.totalSignals.toString()}
          change={`${stats.activeCount} active`}
          trend={stats.activeCount > 0 ? 'up' : 'neutral'}
          subtitle={`${stats.pendingCount} pending`}
        />
        <StatCard
          title="Completed"
          value={stats.completedCount.toString()}
          change={`${stats.expiredCount} expired`}
          trend="neutral"
        />
        <StatCard
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          change={stats.avgConfidence >= 70 ? 'Strong' : stats.avgConfidence >= 50 ? 'Moderate' : 'Low'}
          trend={stats.avgConfidence >= 70 ? 'up' : stats.avgConfidence >= 50 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Avg Score"
          value={stats.avgScore.toFixed(1)}
          change={`${stats.totalSignals} samples`}
          trend={stats.avgScore >= 70 ? 'up' : 'neutral'}
        />
      </div>

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <SignalsPanel signals={signals} />
      </div>
    </div>
  )
}
