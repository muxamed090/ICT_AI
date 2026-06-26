export interface MarketData {
  symbol: string
  bid: number
  ask: number
  spread: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  timeframe: string
  lastUpdate: string
  trend: 'up' | 'down' | 'neutral'
  volatility: 'high' | 'medium' | 'low'
  status: 'open' | 'closed'
}
