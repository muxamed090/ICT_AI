"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { MarketData } from "./MarketDataTypes"
import { LiveMarketGenerator } from "./LiveMarketGenerator"


interface MarketDataContextValue {
  data: MarketData[]
  getSymbol: (symbol: string) => MarketData | undefined
}


const MarketDataContext =
  createContext<MarketDataContextValue | null>(null)


const TICK_INTERVAL_MS = 15000



export function MarketDataProvider({
  children,
}: {
  children: React.ReactNode
}) {


  const generatorRef = useRef<LiveMarketGenerator | null>(null)


  const [data, setData] = useState<MarketData[]>([])



  useEffect(() => {


    if (!generatorRef.current) {

      generatorRef.current =
        new LiveMarketGenerator()

    }



    const updateMarket = async () => {

      try {

        await generatorRef.current!.tick()


        setData(
          [
            ...generatorRef.current!.getAllData()
          ]
        )


      } catch (error) {

        console.error(
          "Market update failed:",
          error
        )

      }

    }



    updateMarket()



    const interval =
      setInterval(
        updateMarket,
        TICK_INTERVAL_MS
      )



    return () =>
      clearInterval(interval)



  }, [])



  const getSymbol = useCallback(
    (symbol: string) => {

      return data.find(
        item =>
          item.symbol === symbol
      )

    },
    [data]
  )



  return (

    <MarketDataContext.Provider
      value={{
        data,
        getSymbol
      }}
    >

      {children}

    </MarketDataContext.Provider>

  )

}




export function useMarketData() {

  const ctx =
    useContext(
      MarketDataContext
    )


  if (!ctx) {

    throw new Error(
      "useMarketData must be inside Provider"
    )

  }


  return ctx

}