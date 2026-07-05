import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import DecisionEnginePanel from '@/components/dashboard/DecisionEnginePanel'
import { DecisionOutput } from '@/lib/decision/types'

export const dynamic = 'force-dynamic'

export default async function DecisionEnginePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let decisions: DecisionOutput[] = []
  let session = 'london'
  let killzone: string | null = null

  try {
    const { GET } = await import('@/app/api/decision-engine/route')
    const res = await GET(new Request('http://localhost/api/decision-engine'))
    const data = await res.json()
    decisions = Array.isArray(data.decisions) ? data.decisions : []
    session = data.session ?? 'london'
    killzone = data.killzone ?? null
  } catch (err) {
    console.error('Decision Engine error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Decision Engine"
        subtitle="Final trade decision combining ICT Engine + ML Engine + Rules Engine into one actionable plan."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <DecisionEnginePanel
          decisions={decisions}
          session={session}
          killzone={killzone}
        />
      </div>
    </div>
  )
}