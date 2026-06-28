import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'
import { BrokerAccountRepository } from '@/lib/repositories/BrokerAccountRepository'
import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { TelegramService } from '@/lib/services/TelegramService'
import PageTitle from '@/components/widgets/PageTitle'
import SystemMonitorConsole from '@/components/dashboard/SystemMonitorConsole'
import TelegramStatusCard from '@/components/dashboard/TelegramStatusCard'

export const dynamic = 'force-dynamic'

export default async function SystemMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const liveRepo = new LiveTradingRepository(supabase)
  const brokerRepo = new BrokerAccountRepository(supabase)
  const telegramRepo = new TelegramRepository(supabase)
  const settingsRepo = new SettingsRepository(supabase)
  const telegramService = new TelegramService(telegramRepo, settingsRepo)

  const [accounts, allLogs, executionLogs, riskLogs, telegramStatus, telegramLogs] = await Promise.all([
    brokerRepo.getAll(user.id),
    liveRepo.getRecentLogs(user.id, 100),
    liveRepo.getLogsByCategory(user.id, 'execution', 50),
    liveRepo.getLogsByCategory(user.id, 'risk', 50),
    telegramService.getStatus(user.id),
    telegramService.getRecentLogs(user.id, 20),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageTitle
        title="System Monitor"
        subtitle="Real-time audit log, execution history, circuit breaker status, and risk events."
        badge="Production"
        badgeColor="rose"
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SystemMonitorConsole
            accounts={accounts}
            allLogs={allLogs}
            executionLogs={executionLogs}
            riskLogs={riskLogs}
          />
        </div>
        <div className="lg:col-span-4">
          <TelegramStatusCard
            status={telegramStatus}
            recentLogs={telegramLogs}
          />
        </div>
      </div>
    </div>
  )
}
