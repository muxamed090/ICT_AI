import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { MlModelRegistryRepository } from '@/lib/repositories/MlModelRegistryRepository'
import { MlPredictionRepository } from '@/lib/repositories/MlPredictionRepository'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import PageTitle from '@/components/widgets/PageTitle'
import MlEngineConsole from '@/components/dashboard/MlEngineConsole'

export const dynamic = 'force-dynamic'

export default async function MlEnginePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settingsRepo = new SettingsRepository(supabase)
  const mlModelRepo = new MlModelRegistryRepository(supabase)
  const mlPredictionRepo = new MlPredictionRepository(supabase)
  const rulesRepo = new IctRulesRepository(supabase)

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

  const [activeModel, stats, predictions, modelHistory, rules] = await Promise.all([
    mlModelRepo.getActiveModel(user.id),
    mlPredictionRepo.getStats(user.id),
    mlPredictionRepo.getByUser(user.id, 50),
    mlModelRepo.getHistory(user.id),
    rulesRepo.getByUser(user.id),
  ])

  const canTrain = stats.withOutcomes >= (settings?.ml_min_training_samples ?? 10)

  return (
    <div className="space-y-6">
      <PageTitle
        title="ML Engine"
        subtitle="Continuous learning pipeline — calibrates ICT rule weights from historical trade outcomes to improve confluence scoring accuracy."
      />
      <MlEngineConsole
        activeModel={activeModel}
        stats={stats}
        canTrain={canTrain}
        initialPredictions={predictions}
        modelHistory={modelHistory}
        settings={settings}
        baseRuleCount={rules.length}
      />
    </div>
  )
}
