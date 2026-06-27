import {
  PeriodPerformance,
  PairStat,
  SessionStat,
  IctSetupStat,
  TradingSession,
} from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class PerformanceAggregator {
  /**
   * Helper function to compute win rate, profit factor, expectancy, and stats for a given set of trades.
   */
  private static computeStats(trades: BacktestTradeInput[]) {
    const completed = trades.filter((t) => t.journalEntry.result !== 'pending')
    const wins = completed.filter((t) => t.journalEntry.result === 'win')
    const losses = completed.filter((t) => t.journalEntry.result === 'loss')
    const total = completed.length

    const winRate = total > 0 ? Number(((wins.length / total) * 100).toFixed(2)) : 0
    const netPnl = Number(completed.reduce((sum, t) => sum + Number(t.journalEntry.pnl || 0), 0).toFixed(2))
    const grossProfit = wins.reduce((sum, t) => sum + Number(t.journalEntry.pnl || 0), 0)
    const grossLoss = losses.reduce((sum, t) => sum + Math.abs(Number(t.journalEntry.pnl || 0)), 0)

    const profitFactor =
      grossLoss > 0
        ? Number((grossProfit / grossLoss).toFixed(2))
        : Number(grossProfit.toFixed(2))

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0
    const expectancy =
      total > 0
        ? Number(((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss).toFixed(2))
        : 0

    const avgRR =
      total > 0
        ? Number((completed.reduce((sum, t) => sum + Number(t.journalEntry.risk_reward || 0), 0) / total).toFixed(2))
        : 0

    return {
      trades: total,
      wins: wins.length,
      losses: losses.length,
      winRate,
      netPnl,
      grossProfit,
      grossLoss,
      profitFactor,
      expectancy,
      avgRR,
    }
  }

  /** Aggregates performance by Day (YYYY-MM-DD) */
  static byDay(trades: BacktestTradeInput[]): PeriodPerformance[] {
    const groups = new Map<string, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const dateStr = t.journalEntry.created_at.split('T')[0]
      const existing = groups.get(dateStr) || []
      existing.push(t)
      groups.set(dateStr, existing)
    })

    const results: PeriodPerformance[] = []
    groups.forEach((groupTrades, period) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        period,
        periodType: 'daily',
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        profitFactor: stats.profitFactor,
      })
    })

    return results.sort((a, b) => a.period.localeCompare(b.period))
  }

  /** Aggregates performance by Week (YYYY-Www) */
  static byWeek(trades: BacktestTradeInput[]): PeriodPerformance[] {
    const groups = new Map<string, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const d = new Date(t.journalEntry.created_at)
      const year = d.getFullYear()
      const oneJan = new Date(year, 0, 1)
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
      const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7)
      const period = `${year}-W${week < 10 ? '0' + week : week}`

      const existing = groups.get(period) || []
      existing.push(t)
      groups.set(period, existing)
    })

    const results: PeriodPerformance[] = []
    groups.forEach((groupTrades, period) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        period,
        periodType: 'weekly',
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        profitFactor: stats.profitFactor,
      })
    })

    return results.sort((a, b) => a.period.localeCompare(b.period))
  }

  /** Aggregates performance by Month (YYYY-MM) */
  static byMonth(trades: BacktestTradeInput[]): PeriodPerformance[] {
    const groups = new Map<string, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const period = t.journalEntry.created_at.substring(0, 7)
      const existing = groups.get(period) || []
      existing.push(t)
      groups.set(period, existing)
    })

    const results: PeriodPerformance[] = []
    groups.forEach((groupTrades, period) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        period,
        periodType: 'monthly',
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        profitFactor: stats.profitFactor,
      })
    })

    return results.sort((a, b) => a.period.localeCompare(b.period))
  }

  /** Aggregates performance by Pair */
  static byPair(trades: BacktestTradeInput[]): PairStat[] {
    const groups = new Map<string, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const pair = t.journalEntry.pair
      const existing = groups.get(pair) || []
      existing.push(t)
      groups.set(pair, existing)
    })

    const results: PairStat[] = []
    groups.forEach((groupTrades, pair) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        pair,
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        avgRR: stats.avgRR,
        profitFactor: stats.profitFactor,
        expectancy: stats.expectancy,
      })
    })

    return results.sort((a, b) => b.netPnl - a.netPnl)
  }

  /** Aggregates performance by Trading Session */
  static bySession(trades: BacktestTradeInput[]): SessionStat[] {
    const groups = new Map<TradingSession, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const session = t.journalEntry.session
      const existing = groups.get(session) || []
      existing.push(t)
      groups.set(session, existing)
    })

    const results: SessionStat[] = []
    groups.forEach((groupTrades, session) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        session,
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        profitFactor: stats.profitFactor,
        avgRR: stats.avgRR,
      })
    })

    return results.sort((a, b) => b.netPnl - a.netPnl)
  }

  /** Aggregates performance by ICT Setup Type */
  static bySetupType(trades: BacktestTradeInput[]): IctSetupStat[] {
    const groups = new Map<string, BacktestTradeInput[]>()

    trades.forEach((t) => {
      const setupType = t.journalEntry.setup_type || 'Unspecified'
      const existing = groups.get(setupType) || []
      existing.push(t)
      groups.set(setupType, existing)
    })

    const results: IctSetupStat[] = []
    groups.forEach((groupTrades, setupType) => {
      const stats = this.computeStats(groupTrades)
      results.push({
        setupType,
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        netPnl: stats.netPnl,
        avgRR: stats.avgRR,
      })
    })

    return results.sort((a, b) => b.netPnl - a.netPnl)
  }
}
