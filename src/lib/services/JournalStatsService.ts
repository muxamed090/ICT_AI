import { TradeJournal } from '@/types/database'

export interface JournalStats {
  totalTrades: number
  completedCount: number
  pendingCount: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  netPnl: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  avgRR: number
  bestTrade: number
  worstTrade: number
}

export function computeJournalStats(trades: TradeJournal[]): JournalStats {
  const completed = trades.filter((t) => t.result !== 'pending')
  const pending = trades.filter((t) => t.result === 'pending')
  const wins = completed.filter((t) => t.result === 'win')
  const losses = completed.filter((t) => t.result === 'loss')
  const breakevens = completed.filter((t) => t.result === 'breakeven')

  const totalFinished = completed.length
  const winRate = totalFinished > 0 ? (wins.length / totalFinished) * 100 : 0
  const netPnl = trades.reduce((acc, t) => acc + Number(t.pnl || 0), 0)
  const grossProfit = wins.reduce((acc, t) => acc + Number(t.pnl || 0), 0)
  const grossLoss = losses.reduce((acc, t) => acc + Math.abs(Number(t.pnl || 0)), 0)
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit

  const avgRR = completed.length > 0
    ? completed.reduce((acc, t) => acc + Number(t.risk_reward || 0), 0) / completed.length
    : 0

  const pnls = completed.map((t) => Number(t.pnl || 0))
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0

  return {
    totalTrades: trades.length,
    completedCount: completed.length,
    pendingCount: pending.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    avgRR,
    bestTrade,
    worstTrade,
  }
}
