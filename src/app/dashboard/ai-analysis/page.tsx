import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import AIAnalysisPanel from '@/components/dashboard/AIAnalysisPanel'
import { EngineOutput } from '@/lib/engine/types'

export const dynamic = 'force-dynamic'

export default async function AIAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let analyses: EngineOutput[] = []

  try {
    const { GET } = await import('@/app/api/ai-analysis/route')
    const res = await GET()
    const data = await res.json()
    analyses = Array.isArray(data.analyses) ? data.analyses : []
  } catch (err) {
    console.error('AI Analysis error:', err)
    analyses = []
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="AI Analysis"
        subtitle="ICT Engine - Trend, Momentum, Risk, Rules and Confidence analysis per signal."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <AIAnalysisPanel analyses={analyses} />
      </div>
    </div>
  )
}