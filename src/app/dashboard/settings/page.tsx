import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import PageTitle from '@/components/widgets/PageTitle'
import SettingsForm from '@/components/dashboard/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settingsRepo = new SettingsRepository(supabase)
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
    })
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Settings"
        subtitle="Configure your trading preferences, risk parameters, AI engine, and notification integrations."
      />

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
