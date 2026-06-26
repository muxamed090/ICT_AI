import React from 'react'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WatchlistRepository } from '@/lib/repositories/WatchlistRepository'
import PageTitle from '@/components/widgets/PageTitle'
import { MarketDataProvider } from '@/lib/market/MarketDataProvider'
import WatchlistPanel from '@/components/dashboard/WatchlistPanel'

export const dynamic = 'force-dynamic'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const watchlistRepo = new WatchlistRepository(supabase)
  const watchlist = await watchlistRepo.getAll(user.id)

  const favorites = watchlist.filter((w) => w.favorite)
  const monitoring = watchlist.filter((w) => w.enabled)

  return (
    <div className="space-y-6">
      <PageTitle
        title="Watchlist Manager"
        subtitle="Manage your monitored currency pairs, favorites, and market data feeds."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pairs', value: watchlist.length },
          { label: 'Monitoring', value: monitoring.length },
          { label: 'Favorites', value: favorites.length },
          { label: 'Disabled', value: watchlist.length - monitoring.length },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-1">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Favorites Quick Row */}
      {favorites.length > 0 && (
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Starred Favorites
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.map((w) => (
              <span
                key={w.id}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wide"
              >
                {w.pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Panel */}
      <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5 space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          Watchlist
        </p>
        <MarketDataProvider>
          <WatchlistPanel initialItems={watchlist} />
        </MarketDataProvider>
      </div>
    </div>
  )
}
