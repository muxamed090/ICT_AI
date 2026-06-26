import { MarketData } from './MarketDataTypes'

interface BasePrice {
  symbol: string
  base: number
  pipSize: number
  typicalSpreadPips: number
  volumeBase: number
}

const BASE_PRICES: BasePrice[] = [
  { symbol: 'EURUSD', base: 1.08450, pipSize: 0.0001, typicalSpreadPips: 0.8, volumeBase: 8500 },
  { symbol: 'GBPUSD', base: 1.26870, pipSize: 0.0001, typicalSpreadPips: 1.0, volumeBase: 7200 },
  { symbol: 'USDJPY', base: 156.420, pipSize: 0.01,   typicalSpreadPips: 0.6, volumeBase: 9100 },
  { symbol: 'EURJPY', base: 169.550, pipSize: 0.01,   typicalSpreadPips: 1.2, volumeBase: 6400 },
  { symbol: 'AUDUSD', base: 0.65340, pipSize: 0.0001, typicalSpreadPips: 1.1, volumeBase: 5800 },
  { symbol: 'USDCAD', base: 1.36120, pipSize: 0.0001, typicalSpreadPips: 1.3, volumeBase: 5500 },
  { symbol: 'USDCHF', base: 0.89760, pipSize: 0.0001, typicalSpreadPips: 1.2, volumeBase: 4800 },
  { symbol: 'NZDUSD', base: 0.60120, pipSize: 0.0001, typicalSpreadPips: 1.5, volumeBase: 3900 },
  { symbol: 'XAUUSD', base: 2345.50, pipSize: 0.01,   typicalSpreadPips: 30,  volumeBase: 4200 },
  { symbol: 'BTCUSD', base: 67450.00, pipSize: 1.0,   typicalSpreadPips: 50,  volumeBase: 3100 },
]

const TREND_OPTIONS: MarketData['trend'][] = ['up', 'down', 'neutral']
const VOLATILITY_OPTIONS: MarketData['volatility'][] = ['high', 'medium', 'low']

export class MockMarketGenerator {
  private readonly state: Map<string, MarketData> = new Map()

  constructor() {
    this.initializeAll()
  }

  private initializeAll(): void {
    BASE_PRICES.forEach((bp) => {
      const spread = bp.typicalSpreadPips * bp.pipSize
      const open = bp.base
      const close = bp.base
      const high = bp.base + bp.pipSize * 8
      const low = bp.base - bp.pipSize * 5
      const bid = bp.base
      const ask = bp.base + spread

      this.state.set(bp.symbol, {
        symbol: bp.symbol,
        bid,
        ask,
        spread,
        open,
        high,
        low,
        close,
        volume: bp.volumeBase,
        timeframe: 'LIVE',
        lastUpdate: new Date().toISOString(),
        trend: TREND_OPTIONS[Math.floor(bp.base * 3) % 3],
        volatility: VOLATILITY_OPTIONS[Math.floor(bp.volumeBase / 3000) % 3],
        status: 'open',
      })
    })
  }

  tick(): void {
    BASE_PRICES.forEach((bp) => {
      const current = this.state.get(bp.symbol)
      if (!current) return

      const maxPipMove = 3
      const direction = Math.random() > 0.5 ? 1 : -1
      const pipMove = direction * Math.random() * maxPipMove * bp.pipSize
      const spread = bp.typicalSpreadPips * bp.pipSize

      const newClose = parseFloat((current.close + pipMove).toFixed(bp.symbol === 'BTCUSD' ? 2 : bp.symbol === 'XAUUSD' ? 2 : bp.pipSize < 0.01 ? 5 : 3))
      const newBid = newClose
      const newAsk = parseFloat((newClose + spread).toFixed(bp.symbol === 'BTCUSD' ? 2 : bp.symbol === 'XAUUSD' ? 2 : bp.pipSize < 0.01 ? 5 : 3))
      const newHigh = Math.max(current.high, newClose)
      const newLow = Math.min(current.low, newClose)
      const volumeDelta = Math.floor(Math.random() * 40)

      const priceDiff = newClose - current.open
      const trend: MarketData['trend'] = Math.abs(priceDiff) < bp.pipSize * 2 ? 'neutral' : priceDiff > 0 ? 'up' : 'down'
      const volume = current.volume + volumeDelta
      const volatility: MarketData['volatility'] = volume > bp.volumeBase * 1.2 ? 'high' : volume > bp.volumeBase * 0.8 ? 'medium' : 'low'

      this.state.set(bp.symbol, {
        ...current,
        bid: newBid,
        ask: newAsk,
        high: newHigh,
        low: newLow,
        close: newClose,
        volume,
        trend,
        volatility,
        lastUpdate: new Date().toISOString(),
      })
    })
  }

  getAllData(): MarketData[] {
    return Array.from(this.state.values())
  }

  getDataForSymbol(symbol: string): MarketData | undefined {
    return this.state.get(symbol)
  }

  getSymbols(): string[] {
    return BASE_PRICES.map((bp) => bp.symbol)
  }
}
