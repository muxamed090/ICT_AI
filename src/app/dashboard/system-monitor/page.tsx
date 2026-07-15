import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import SystemMonitorPanel from '@/components/dashboard/SystemMonitorPanel'
import { SystemHealth } from '@/lib/monitor/types'

export const dynamic = 'force-dynamic'

export default async function SystemMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let health: SystemHealth | null = null

  try {
    const { GET } = await import('@/app/api/system-monitor/route')
    const res = await GET()
    const data = await res.json()
    health = data.health ?? null
  } catch (err) {
    console.error('System Monitor error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="System Monitor"
        subtitle="Real-time health check of all engines, APIs, broker connection and performance metrics."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <SystemMonitorPanel initialHealth={health} />
      </div>
    </div>
  )
}