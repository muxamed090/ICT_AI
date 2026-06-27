import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { BrokerAccountRepository } from '@/lib/repositories/BrokerAccountRepository'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'
import PageTitle from '@/components/widgets/PageTitle'
import LiveTradingConsole from '@/components/dashboard/LiveTradingConsole'

export const dynamic = 'force-dynamic'

export default async function LiveTradingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settingsRepo = new SettingsRepository(supabase)
  const brokerRepo = new BrokerAccountRepository(supabase)
  const liveRepo = new LiveTradingRepository(supabase)

  let settings = await settingsRepo.getById(user.id)
  if (!settings) {
    settings = await settingsRepo.create({
      id: user.id,
      theme: 'dark',
      timezone: 'UTC',
      language: 'en',
      notification_enabled: true,
      telegram_enabled: false,
      telegram_chat_id: null,
      risk_percent: 1.0,
      ai_learning_enabled: true,
      ml_mode: 'hybrid',
      signal_threshold: 7.00,
      max_spread_allowed: 3.00,
      daily_drawdown_limit: 5.00,
      news_buffer_minutes: 30,
      risk_profile: 'balanced',
      ml_confidence_weight: 0.30,
      ml_min_training_samples: 10,
      ml_auto_retrain: true,
    })
  }

  const [accounts, activeAccount, recentOrders, openPositions, recentLogs] = await Promise.all([
    brokerRepo.getAll(user.id),
    brokerRepo.getActive(user.id),
    liveRepo.getRecentOrders(user.id, 30),
    liveRepo.getOpenPositions(user.id),
    liveRepo.getRecentLogs(user.id, 50),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageTitle
        title="Live Trading"
        subtitle="Manage broker connections, monitor positions, and control execution modes."
        badge="Phase 12"
        badgeColor="emerald"
      />
      <LiveTradingConsole
        settings={settings}
        accounts={accounts}
        activeAccount={activeAccount}
        recentOrders={recentOrders}
        openPositions={openPositions}
        recentLogs={recentLogs}
      />
    </div>
  )
}
