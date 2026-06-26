import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AiAnalysisRepository } from '@/lib/repositories/AiAnalysisRepository'
import { computeAiAnalysisStats } from '@/lib/services/AiAnalysisStatsService'
import PageTitle from '@/components/widgets/PageTitle'
import StatCard from '@/components/widgets/StatCard'
import AiAnalysisPanel from '@/components/dashboard/AiAnalysisPanel'

export const dynamic = 'force-dynamic'

export default async function AiAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const aiRepo = new AiAnalysisRepository(supabase)
  const analyses = await aiRepo.getAll(user.id)
  const stats = computeAiAnalysisStats(analyses)

  return (
    <div className="space-y-6">
      <PageTitle
        title="AI Structure Analysis"
        subtitle="ICT market structure analysis records with BOS, CHoCH, Order Blocks, FVG, and confluence scoring."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Analyses"
          value={stats.totalAnalyses.toString()}
          change={stats.totalAnalyses > 0 ? `Latest: ${analyses[0]?.pair}` : 'No data'}
          trend="neutral"
        />
        <StatCard
          title="Avg Confluence"
          value={stats.avgConfluence.toFixed(1)}
          change={stats.avgConfluence >= 70 ? 'Strong' : stats.avgConfluence >= 40 ? 'Moderate' : 'Weak'}
          trend={stats.avgConfluence >= 70 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          change={`${stats.totalAnalyses} samples`}
          trend={stats.avgConfidence >= 70 ? 'up' : stats.avgConfidence >= 50 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Dominant Bias"
          value={stats.dominantBias}
          change={`B:${stats.biasCounts.bullish} / S:${stats.biasCounts.bearish} / N:${stats.biasCounts.neutral}`}
          trend={stats.dominantBiasTrend}
        />
      </div>

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <AiAnalysisPanel analyses={analyses} />
      </div>
    </div>
  )
}
