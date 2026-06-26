"use client"

import React from 'react'
import { useMarketData } from '@/lib/market/MarketDataProvider'
import { formatPrice, trendIcon, trendColor } from '@/lib/market/MarketDataUtils'

// Shows a compact scrolling ticker of all pairs
export default function MarketMiniTicker() {
  const { data } = useMarketData()

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {data.map((d) => {
          const tColor = trendColor(d.trend)
          const trend = trendIcon(d.trend)
          return (
            <div
              key={d.symbol}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-[10px] font-bold text-white">{d.symbol}</span>
              <span className={`text-[10px] font-mono font-semibold ${tColor}`}>
                {trend} {formatPrice(d.bid, d.symbol)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
