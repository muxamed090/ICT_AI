import { MarketData } from './MarketDataTypes'

export function formatPrice(value: number, symbol: string): string {
  const isJpy = symbol.includes('JPY')
  const isCrypto = symbol === 'BTCUSD'
  const isGold = symbol === 'XAUUSD'

  if (isCrypto) return value.toFixed(2)
  if (isGold) return value.toFixed(2)
  if (isJpy) return value.toFixed(3)
  return value.toFixed(5)
}

export function formatSpread(spread: number, symbol: string): string {
  const isJpy = symbol.includes('JPY')
  const isCrypto = symbol === 'BTCUSD'
  const isGold = symbol === 'XAUUSD'

  let pips: number
  if (isCrypto) pips = spread
  else if (isGold) pips = spread
  else if (isJpy) pips = spread / 0.01
  else pips = spread / 0.0001

  return `${pips.toFixed(1)} pips`
}

export function trendIcon(trend: MarketData['trend']): string {
  if (trend === 'up') return '▲'
  if (trend === 'down') return '▼'
  return '—'
}

export function trendColor(trend: MarketData['trend']): string {
  if (trend === 'up') return 'text-emerald-400'
  if (trend === 'down') return 'text-rose-400'
  return 'text-slate-400'
}

export function volatilityColor(volatility: MarketData['volatility']): string {
  if (volatility === 'high') return 'text-rose-400'
  if (volatility === 'medium') return 'text-amber-400'
  return 'text-slate-400'
}

export function statusColor(status: MarketData['status']): string {
  return status === 'open' ? 'text-emerald-400' : 'text-slate-500'
}

export function timeSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}
