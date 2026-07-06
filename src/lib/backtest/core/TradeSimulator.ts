import { Candle, BacktestTrade, BacktestConfig } from '../types'

export function simulateTrade(
    trade: BacktestTrade,
    futureCandles: Candle[],
    config: BacktestConfig
): BacktestTrade {
    const pip = trade.pair.includes('JPY') || trade.pair.includes('XAU') ? 0.01 : 0.0001
    const riskAmount = config.accountBalance * (config.riskPercent / 100)

    for (const candle of futureCandles) {
        const high = candle.high
        const low = candle.low

        if (trade.direction === 'buy') {
            // Check SL hit
            if (low <= trade.stopLoss) {
                const slPips = Math.abs(trade.entryPrice - trade.stopLoss) / pip
                return {
                    ...trade,
                    outcome: 'loss',
                    exitPrice: trade.stopLoss,
                    exitTime: candle.timestamp,
                    rrAchieved: -1,
                    pnl: -riskAmount,
                }
            }
            // Check TP1 hit
            if (high >= trade.tp1) {
                const tp1Pips = Math.abs(trade.tp1 - trade.entryPrice) / pip
                const slPips = Math.abs(trade.entryPrice - trade.stopLoss) / pip
                const rr = parseFloat((tp1Pips / slPips).toFixed(2))
                return {
                    ...trade,
                    outcome: 'win',
                    exitPrice: trade.tp1,
                    exitTime: candle.timestamp,
                    rrAchieved: rr,
                    pnl: riskAmount * rr,
                }
            }
        } else {
            // SELL
            if (high >= trade.stopLoss) {
                return {
                    ...trade,
                    outcome: 'loss',
                    exitPrice: trade.stopLoss,
                    exitTime: candle.timestamp,
                    rrAchieved: -1,
                    pnl: -riskAmount,
                }
            }
            if (low <= trade.tp1) {
                const tp1Pips = Math.abs(trade.entryPrice - trade.tp1) / pip
                const slPips = Math.abs(trade.stopLoss - trade.entryPrice) / pip
                const rr = parseFloat((tp1Pips / slPips).toFixed(2))
                return {
                    ...trade,
                    outcome: 'win',
                    exitPrice: trade.tp1,
                    exitTime: candle.timestamp,
                    rrAchieved: rr,
                    pnl: riskAmount * rr,
                }
            }
        }
    }

    // No exit found — breakeven
    return {
        ...trade,
        outcome: 'breakeven',
        exitPrice: trade.entryPrice,
        exitTime: futureCandles[futureCandles.length - 1]?.timestamp,
        rrAchieved: 0,
        pnl: 0,
    }
}