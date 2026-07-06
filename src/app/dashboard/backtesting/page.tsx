import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import BacktestPanel from '@/components/dashboard/BacktestPanel'
import { BacktestReport } from '@/lib/backtest/types'

export const dynamic = 'force-dynamic'

export default async function BacktestingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let initialReport: BacktestReport | null = null

  try {
    const { GET } = await import('@/app/api/backtest/route')
    const res = await GET()
    const data = await res.json()
    initialReport = data.report ?? null
  } catch (err) {
    console.error('Backtest error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Backtesting"
        subtitle="Test your ICT strategy on 30 days of historical data using real engines."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <BacktestPanel initialReport={initialReport} />
      </div>
    </div>
  )
}