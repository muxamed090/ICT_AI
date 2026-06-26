"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { MarketData } from './MarketDataTypes'
import { MockMarketGenerator } from './MockMarketGenerator'

interface MarketDataContextValue {
  data: MarketData[]
  getSymbol: (symbol: string) => MarketData | undefined
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

const TICK_INTERVAL_MS = 2000

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const generatorRef = useRef<MockMarketGenerator>(new MockMarketGenerator())
  const [data, setData] = useState<MarketData[]>(() => generatorRef.current.getAllData())

  useEffect(() => {
    const interval = setInterval(() => {
      generatorRef.current.tick()
      setData([...generatorRef.current.getAllData()])
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const getSymbol = useCallback((symbol: string): MarketData | undefined => {
    return data.find((d) => d.symbol === symbol)
  }, [data])

  return (
    <MarketDataContext.Provider value={{ data, getSymbol }}>
      {children}
    </MarketDataContext.Provider>
  )
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(MarketDataContext)
  if (!ctx) throw new Error('useMarketData must be used inside <MarketDataProvider>')
  return ctx
}
