"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { MarketData } from './MarketDataTypes'
import { LiveMarketGenerator } from './LiveMarketGenerator'

interface MarketDataContextValue {
  data: MarketData[]
  getSymbol: (symbol: string) => MarketData | undefined
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

const TICK_INTERVAL_MS = 15000


export function MarketDataProvider({ children }: { children: React.ReactNode }) {

  const generatorRef = useRef<LiveMarketGenerator>(
    new LiveMarketGenerator()
  )

  const [data, setData] = useState<MarketData[]>([])


  useEffect(() => {

    const updateMarket = async () => {

      await generatorRef.current.tick()

      setData([
        ...generatorRef.current.getAllData()
      ])

    }


    updateMarket()


    const interval = setInterval(
      updateMarket,
      TICK_INTERVAL_MS
    )


    return () => clearInterval(interval)


  }, [])



  const getSymbol = useCallback(
    (symbol: string): MarketData | undefined => {

      return data.find(
        (d) => d.symbol === symbol
      )

    },
    [data]
  )


  return (
    <MarketDataContext.Provider value={{ data, getSymbol }}>
      {children}
    </MarketDataContext.Provider>
  )
}


export function useMarketData(): MarketDataContextValue {

  const ctx = useContext(MarketDataContext)

  if (!ctx)
    throw new Error(
      'useMarketData must be used inside <MarketDataProvider>'
    )

  return ctx
}