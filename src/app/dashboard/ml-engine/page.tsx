import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import MLEnginePanel from '@/components/dashboard/MLEnginePanel'

export const dynamic = 'force-dynamic'

export default async function MLEnginePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let results: unknown[] = []
  let session = 'london'

  try {
    const { GET } = await import('@/app/api/ml-engine/route')
    const res = await GET()
    const data = await res.json()
    results = data.results ?? []
    session = data.session ?? 'london'
  } catch (err) {
    console.error('ML Engine error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="ML Engine"
        subtitle="Pattern learning, historical statistics, win rate analysis & confidence optimization."
      />
      {results.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm">No ML data available.</div>
      ) : (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
          <MLEnginePanel results={results as never} session={session} />
        </div>
      )}
    </div>
  )
}