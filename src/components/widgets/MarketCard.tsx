import React from 'react'
import { MarketData } from '@/lib/market/MarketDataTypes'
import { formatPrice, formatSpread, trendIcon, volatilityColor, statusColor, timeSince } from '@/lib/market/MarketDataUtils'

interface MarketCardProps {
  data: MarketData
}

export default function MarketCard({ data }: MarketCardProps) {
  const trend = trendIcon(data.trend)
  const vColor = volatilityColor(data.volatility)
  const sColor = statusColor(data.status)

  return (
    <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-white">{data.symbol}</p>
          <p className={`text-[10px] font-semibold ${sColor} uppercase tracking-wider`}>{data.status}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
          data.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
          data.trend === 'down' ? 'bg-rose-500/10 text-rose-400' :
          'bg-white/5 text-slate-400'
        }`}>
          {trend} {data.trend.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-4 text-xs font-mono">
        <div>
          <p className="text-slate-500 text-[9px] uppercase">Bid</p>
          <p className="text-white font-bold">{formatPrice(data.bid, data.symbol)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[9px] uppercase">Ask</p>
          <p className="text-slate-300">{formatPrice(data.ask, data.symbol)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[9px] uppercase">Spread</p>
          <p className="text-slate-400">{formatSpread(data.spread, data.symbol)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-white/[0.03] pt-2">
        <span className={`text-[10px] font-semibold ${vColor}`}>
          {data.volatility.toUpperCase()} VOL
        </span>
        <span className="text-[9px] text-slate-500 font-mono">{timeSince(data.lastUpdate)}</span>
      </div>
    </div>
  )
}
