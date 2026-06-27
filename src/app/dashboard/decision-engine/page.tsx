import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { AiDecisionRepository } from '@/lib/repositories/AiDecisionRepository'
import PageTitle from '@/components/widgets/PageTitle'
import DecisionEngineConsole from '@/components/dashboard/DecisionEngineConsole'

export const dynamic = 'force-dynamic'

export default async function DecisionEnginePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settingsRepo = new SettingsRepository(supabase)
  const decisionRepo = new AiDecisionRepository(supabase)

  const decisions = await decisionRepo.getByUser(user.id)
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
      ml_mode: 'rules_only',
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

  return (
    <div className="space-y-6">
      <PageTitle
        title="AI Decision Engine"
        subtitle="Evaluate confluent market structures, calculate risk targets and transaction overheads, and dispatch signals."
      />

      <DecisionEngineConsole 
        settings={settings}
        initialDecisions={decisions}
      />
    </div>
  )
}
