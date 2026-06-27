import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'
import { BrokerAccountRepository } from '@/lib/repositories/BrokerAccountRepository'
import PageTitle from '@/components/widgets/PageTitle'
import SystemMonitorConsole from '@/components/dashboard/SystemMonitorConsole'

export const dynamic = 'force-dynamic'

export default async function SystemMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const liveRepo = new LiveTradingRepository(supabase)
  const brokerRepo = new BrokerAccountRepository(supabase)

  const [accounts, allLogs, executionLogs, riskLogs] = await Promise.all([
    brokerRepo.getAll(user.id),
    liveRepo.getRecentLogs(user.id, 100),
    liveRepo.getLogsByCategory(user.id, 'execution', 50),
    liveRepo.getLogsByCategory(user.id, 'risk', 50),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageTitle
        title="System Monitor"
        subtitle="Real-time audit log, execution history, circuit breaker status, and risk events."
        badge="Production"
        badgeColor="rose"
      />
      <SystemMonitorConsole
        accounts={accounts}
        allLogs={allLogs}
        executionLogs={executionLogs}
        riskLogs={riskLogs}
      />
    </div>
  )
}
