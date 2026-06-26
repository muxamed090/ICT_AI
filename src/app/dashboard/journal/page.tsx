import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TradeJournalRepository } from '@/lib/repositories/TradeJournalRepository'
import { computeJournalStats } from '@/lib/services/JournalStatsService'
import PageTitle from '@/components/widgets/PageTitle'
import StatCard from '@/components/widgets/StatCard'
import JournalPanel from '@/components/dashboard/JournalPanel'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const journalRepo = new TradeJournalRepository(supabase)
  const trades = await journalRepo.getAll(user.id)
  const stats = computeJournalStats(trades)

  return (
    <div className="space-y-6">
      <PageTitle
        title="Trade Journal"
        subtitle="Log, review, and analyze all your ICT trading entries with screenshots and performance tracking."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Trades"
          value={stats.totalTrades.toString()}
          change={`${stats.completedCount} completed`}
          trend="neutral"
          subtitle={`${stats.pendingCount} pending`}
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          change={`${stats.wins}W / ${stats.losses}L`}
          trend={stats.winRate >= 50 ? 'up' : stats.winRate > 0 ? 'down' : 'neutral'}
          subtitle={`Profit Factor: ${stats.profitFactor.toFixed(2)}`}
        />
        <StatCard
          title="Net P&L"
          value={`${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(2)}`}
          change={`Best: +$${stats.bestTrade.toFixed(2)}`}
          trend={stats.netPnl >= 0 ? 'up' : 'down'}
          subtitle={`Worst: $${stats.worstTrade.toFixed(2)}`}
          glow={stats.netPnl > 0}
        />
        <StatCard
          title="Avg Risk:Reward"
          value={stats.avgRR.toFixed(1)}
          change={`${stats.completedCount} samples`}
          trend={stats.avgRR >= 1.5 ? 'up' : 'neutral'}
          subtitle="Target: ≥1.5 R:R"
        />
      </div>

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <JournalPanel initialTrades={trades} />
      </div>
    </div>
  )
}
