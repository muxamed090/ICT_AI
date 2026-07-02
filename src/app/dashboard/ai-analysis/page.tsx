import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import AIAnalysisPanel from '@/components/dashboard/AiAnalysisPanel'
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
    analyses = data.analyses ?? []
  } catch (err) {
    console.error('AI Analysis error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="AI Analysis"
        subtitle="ICT Engine — Trend, Momentum, Risk, Rules & Confidence analysis per signal."
      />
      {analyses.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm">No analysis available.</div>
      ) : (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
          <AIAnalysisPanel analyses={analyses} />
        </div>
      )}
    </div>
  )
}