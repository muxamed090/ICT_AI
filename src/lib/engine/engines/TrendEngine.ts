import { SignalInput, TrendResult } from '../types'

export function runTrendEngine(signal: SignalInput): TrendResult {
  const isBuy = signal.direction === 'buy'
  const reasons: string[] = []
  const trend = isBuy ? 'Uptrend' : 'Downtrend'
  const marketBias = isBuy ? 'Bullish' : 'Bearish'
  reasons.push('Direction: ' + signal.direction.toUpperCase() + ' -> ' + trend + ' bias')
  if (signal.score >= 70) reasons.push('Price structure confirms trend direction')
  return { trend, marketBias, reasons }
}