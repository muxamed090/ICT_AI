export type MarketStatusLabel =
  | 'Bullish'
  | 'Bearish'
  | 'Range'
  | 'High Volatility'
  | 'Low Volatility'
  | 'Neutral'

const PAIR_STATUS_MAP: Record<string, MarketStatusLabel> = {
  EURUSD: 'Bullish',
  GBPUSD: 'Bullish',
  USDJPY: 'Bearish',
  EURJPY: 'Range',
  AUDUSD: 'Neutral',
  USDCAD: 'Bearish',
  USDCHF: 'Range',
  NZDUSD: 'Low Volatility',
  XAUUSD: 'High Volatility',
  BTCUSD: 'High Volatility',
}

export function getMarketStatus(symbol: string): MarketStatusLabel {
  return PAIR_STATUS_MAP[symbol] ?? 'Neutral'
}

export function getStatusColor(status: MarketStatusLabel): string {
  switch (status) {
    case 'Bullish': return 'text-emerald-400'
    case 'Bearish': return 'text-rose-400'
    case 'High Volatility': return 'text-amber-400'
    case 'Low Volatility': return 'text-blue-400'
    case 'Range': return 'text-purple-400'
    default: return 'text-slate-400'
  }
}

export function getStatusBadgeColor(status: MarketStatusLabel): string {
  switch (status) {
    case 'Bullish': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Bearish': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    case 'High Volatility': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'Low Volatility': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'Range': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    default: return 'bg-white/5 text-slate-400 border border-white/10'
  }
}

export function getAllPairStatuses(): { symbol: string; status: MarketStatusLabel }[] {
  return Object.entries(PAIR_STATUS_MAP).map(([symbol, status]) => ({ symbol, status }))
}
