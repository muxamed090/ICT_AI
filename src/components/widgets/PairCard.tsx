import React from 'react'
import { MarketData } from '@/lib/market/MarketDataTypes'
import { MarketStatusLabel, getStatusBadgeColor } from '@/lib/market/marketStatusEngine'
import { formatPrice, trendIcon, trendColor } from '@/lib/market/MarketDataUtils'

interface PairCardProps {
  data: MarketData
  status: MarketStatusLabel
}

export default function PairCard({ data, status }: PairCardProps) {
  const trend = trendIcon(data.trend)
  const tColor = trendColor(data.trend)

  return (
    <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-white leading-none">{data.symbol}</p>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${getStatusBadgeColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className={`text-sm font-mono font-bold ${tColor}`}>
          {trend} {formatPrice(data.bid, data.symbol)}
        </p>
        <p className="text-[9px] text-slate-500 font-mono">
          {data.volatility.toUpperCase()} VOL
        </p>
      </div>
    </div>
  )
}
