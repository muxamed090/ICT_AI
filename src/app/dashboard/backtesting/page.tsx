import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BacktestRunRepository } from '@/lib/repositories/BacktestRunRepository'
import { TradeJournalRepository } from '@/lib/repositories/TradeJournalRepository'
import PageTitle from '@/components/widgets/PageTitle'
import BacktestConsole from '@/components/dashboard/BacktestConsole'

export const dynamic = 'force-dynamic'

export default async function BacktestingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const backtestRepo = new BacktestRunRepository(supabase)
  const journalRepo = new TradeJournalRepository(supabase)

  const [runs, journalTrades] = await Promise.all([
    backtestRepo.getSummaries(user.id),
    journalRepo.getAll(user.id),
  ])

  const completedCount = journalTrades.filter((t) => t.result !== 'pending').length

  return (
    <div className="space-y-6">
      <PageTitle
        title="Backtesting Engine"
        subtitle="Replay ICT AI Trader decisions against historical market journals to evaluate strategy performance, drawdown risks, and ML accuracy."
      />

      <BacktestConsole initialRuns={runs} completedTradeCount={completedCount} />
    </div>
  )
}
