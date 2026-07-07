import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import LiveTradingPanel from '@/components/dashboard/LiveTradingPanel'

export const dynamic = 'force-dynamic'

export default async function LiveTradingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let signals: unknown[] = []
  let state = {
    isConnected: false,
    brokerType: 'demo',
    accountBalance: 10000,
    equity: 10000,
    todayPnl: 0,
    todayTrades: 0,
    dailyDrawdown: 0,
    maxDailyDrawdown: 5,
    openPositions: [],
    pendingOrders: [],
  }
  let session = 'london'
  let killzone: string | null = null

  try {
    const { GET } = await import('@/app/api/live-trading/route')
    const res = await GET()
    const data = await res.json()
    signals = Array.isArray(data.signals) ? data.signals : []
    state = data.state ?? state
    session = data.session ?? 'london'
    killzone = data.killzone ?? null
  } catch (err) {
    console.error('Live Trading error:', err)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Live Trading"
        subtitle="Real-time trade execution powered by ICT Engine + ML Engine + Rules Engine + Decision Engine."
      />
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <LiveTradingPanel
          initialSignals={signals as never}
          initialState={state as never}
          session={session}
          killzone={killzone}
        />
      </div>
    </div>
  )
}