import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import JournalPanel from '@/components/dashboard/JournalPanel'
import { JournalEngine } from '@/lib/journal/JournalEngine'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const engine = new JournalEngine(supabase)

  const [trades, stats, sessionStats, pairStats] = await Promise.all([
    engine.getAll(user.id),
    engine.getStats(user.id),
    engine.getSessionStats(user.id),
    engine.getPairStats(user.id),
  ])

  return (
    <div className="space-y-6">
      <PageTitle
        title="Journal"
        subtitle="Trade logging, AI review, statistics and performance analytics."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <JournalPanel
          initialData={{ trades, stats, sessionStats, pairStats }}
        />
      </div>
    </div>
  )
}
