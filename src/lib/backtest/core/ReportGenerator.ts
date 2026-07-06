import { BacktestConfig, BacktestTrade, BacktestReport } from '../types'
import { analyzePerformance } from './PerformanceAnalyzer'

export function generateReport(
    trades: BacktestTrade[],
    config: BacktestConfig
): BacktestReport {
    const analysis = analyzePerformance(trades, config)

    return {
        config,
        totalTrades: trades.filter((t) => t.outcome !== 'pending').length,
        ...analysis,
        trades,
        generatedAt: new Date().toISOString(),
    }
}