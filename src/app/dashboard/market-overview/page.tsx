import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import { MarketDataProvider } from '@/lib/market/MarketDataProvider'
import MarketOverviewClient from '@/components/dashboard/MarketOverviewClient'

export const dynamic = 'force-dynamic'

export default async function MarketOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <PageTitle
        title="Market Overview"
        subtitle="Live simulated price feeds for all monitored currency pairs and assets."
      />

      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
        <MarketDataProvider>
          <MarketOverviewClient />
        </MarketDataProvider>
      </div>
    </div>
  )
}
