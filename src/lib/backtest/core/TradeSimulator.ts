import { Candle, BacktestTrade, BacktestConfig } from '../types'

export function simulateTrade(
    trade: BacktestTrade,
    futureCandles: Candle[],
    config: BacktestConfig
): BacktestTrade {
    const pip = trade.pair.includes('JPY') || trade.pair.includes('XAU') ? 0.01 : 0.0001
    const riskAmount = config.accountBalance * (config.riskPercent / 100)
    const tp1Pips = Math.abs(trade.tp1 - trade.entryPrice) / pip
    const slPips = Math.abs(trade.entryPrice - trade.stopLoss) / pip

    for (const candle of futureCandles) {
        const high = candle.high
        const low = candle.low

        if (trade.direction === 'buy') {
            // SL hit
            if (low <= trade.stopLoss) {
                return {
                    ...trade,
                    outcome: 'loss',
                    exitPrice: trade.stopLoss,
                    exitTime: candle.timestamp,
                    rrAchieved: -1,
                    pnl: -riskAmount,
                }
            }
            // TP1 hit
            if (high >= trade.tp1) {
                const rr = parseFloat((tp1Pips / slPips).toFixed(2))
                return {
                    ...trade,
                    outcome: 'win',
                    exitPrice: trade.tp1,
                    exitTime: candle.timestamp,
                    rrAchieved: rr,
                    pnl: parseFloat((riskAmount * rr).toFixed(2)),
                }
            }
        } else {
            // SELL — SL hit
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
            // TP1 hit
            if (low <= trade.tp1) {
                const rr = parseFloat((tp1Pips / slPips).toFixed(2))
                return {
                    ...trade,
                    outcome: 'win',
                    exitPrice: trade.tp1,
                    exitTime: candle.timestamp,
                    rrAchieved: rr,
                    pnl: parseFloat((riskAmount * rr).toFixed(2)),
                }
            }
        }
    }

    // No SL/TP hit — determine outcome from last candle
    const lastCandle = futureCandles[futureCandles.length - 1]
    const lastPrice = lastCandle?.close ?? trade.entryPrice

    const movedTowardTP =
        (trade.direction === 'buy' && lastPrice > trade.entryPrice) ||
        (trade.direction === 'sell' && lastPrice < trade.entryPrice)

    const movedPips = Math.abs(lastPrice - trade.entryPrice) / pip
    const progress = tp1Pips > 0 ? movedPips / tp1Pips : 0

    if (movedTowardTP && progress >= 0.5) {
        const rr = parseFloat((progress * (tp1Pips / slPips)).toFixed(2))
        return {
            ...trade,
            outcome: 'win',
            exitPrice: lastPrice,
            exitTime: lastCandle?.timestamp,
            rrAchieved: rr,
            pnl: parseFloat((riskAmount * rr).toFixed(2)),
        }
    } else if (!movedTowardTP && movedPips >= slPips * 0.5) {
        return {
            ...trade,
            outcome: 'loss',
            exitPrice: lastPrice,
            exitTime: lastCandle?.timestamp,
            rrAchieved: -1,
            pnl: -riskAmount,
        }
    }

    return {
        ...trade,
        outcome: 'breakeven',
        exitPrice: trade.entryPrice,
        exitTime: lastCandle?.timestamp,
        rrAchieved: 0,
        pnl: 0,
    }
}