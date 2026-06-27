import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import PageTitle from '@/components/widgets/PageTitle'
import RulesEnginePanel from '@/components/dashboard/RulesEnginePanel'

export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rulesRepo = new IctRulesRepository(supabase)
  let rules = await rulesRepo.getByUser(user.id)

  // Self-healing: if no rules are found, reset to seed defaults
  if (rules.length === 0) {
    rules = await rulesRepo.resetToDefaults(user.id)
  }

  const settingsRepo = new SettingsRepository(supabase)
  const settings = await settingsRepo.getById(user.id)

  return (
    <div className="space-y-6">
      <PageTitle
        title="ICT Rules Engine"
        subtitle="Manage rules weightings and execute real-time confluence simulations on market technical conditions."
      />
      
      <RulesEnginePanel rules={rules} settings={settings!} />
    </div>
  )
}
