import { BacktestConfig, BacktestReport } from './types'
import { generateHistoricalCandles } from './core/DataLoader'
import { generateSignalFromCandle } from './core/SignalGenerator'
import { simulateTrade } from './core/TradeSimulator'
import { generateReport } from './core/ReportGenerator'

export async function runBacktest(
    config: BacktestConfig,
    basePrice: number
): Promise<BacktestReport> {
    const days = 30 // Default 30 days

    // 1. Load historical candles
    const candles = generateHistoricalCandles(config.pair, basePrice, days)

    // 2. Generate signals + simulate trades
    const trades = candles.map((candle, idx) => {
        const signal = generateSignalFromCandle(candle, config)
        if (!signal) return null

        // Simulate using next 10 candles
        const futureCandles = candles.slice(idx + 1, idx + 11)
        if (futureCandles.length === 0) return null

        return simulateTrade(signal, futureCandles, config)
    }).filter(Boolean) as import('./types').BacktestTrade[]

    // 3. Generate report
    return generateReport(trades, config)
}