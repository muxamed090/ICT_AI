export interface PatternRecord {
    pair: string
    direction: 'buy' | 'sell'
    session: string
    setup: string
    timeframe: string
    killzone: string
    trades: number
    wins: number
    winRate: number
    avgRR: number
    avgHoldingHours: number
    strategyVersion: string
}

// Seed patterns — Journal trades-ku waxay cusboonaysiin doonaan
export const PATTERN_DATABASE: PatternRecord[] = [
    {
        pair: 'EURUSD', direction: 'buy', session: 'london',
        setup: 'BOS+FVG', timeframe: 'H1', killzone: 'London Open',
        trades: 81, wins: 68, winRate: 84, avgRR: 2.4,
        avgHoldingHours: 3.2, strategyVersion: 'v1',
    },
    {
        pair: 'EURUSD', direction: 'sell', session: 'new_york',
        setup: 'CHoCH+OB', timeframe: 'H1', killzone: 'NY Open',
        trades: 45, wins: 32, winRate: 71, avgRR: 1.9,
        avgHoldingHours: 2.8, strategyVersion: 'v1',
    },
    {
        pair: 'XAUUSD', direction: 'buy', session: 'london',
        setup: 'BOS+FVG', timeframe: 'M15', killzone: 'London Open',
        trades: 63, wins: 51, winRate: 81, avgRR: 2.8,
        avgHoldingHours: 4.1, strategyVersion: 'v1',
    },
    {
        pair: 'XAUUSD', direction: 'sell', session: 'new_york',
        setup: 'Liquidity+OB', timeframe: 'H1', killzone: 'NY Open',
        trades: 38, wins: 27, winRate: 71, avgRR: 2.1,
        avgHoldingHours: 3.5, strategyVersion: 'v1',
    },
    {
        pair: 'EURJPY', direction: 'buy', session: 'overlap',
        setup: 'BOS+FVG', timeframe: 'M15', killzone: 'London Open',
        trades: 29, wins: 21, winRate: 72, avgRR: 1.8,
        avgHoldingHours: 2.0, strategyVersion: 'v1',
    },
    {
        pair: 'USDCAD', direction: 'sell', session: 'new_york',
        setup: 'CHoCH+FVG', timeframe: 'H1', killzone: 'NY Open',
        trades: 34, wins: 22, winRate: 65, avgRR: 1.7,
        avgHoldingHours: 3.0, strategyVersion: 'v1',
    },
    {
        pair: 'EURUSD', direction: 'buy', session: 'london',
        setup: 'BOS+FVG', timeframe: 'M15', killzone: 'London Open',
        trades: 54, wins: 43, winRate: 80, avgRR: 2.2,
        avgHoldingHours: 2.5, strategyVersion: 'v1',
    },
    {
        pair: 'XAUUSD', direction: 'buy', session: 'asian',
        setup: 'Liquidity+FVG', timeframe: 'H4', killzone: 'Asian Range',
        trades: 22, wins: 14, winRate: 64, avgRR: 2.5,
        avgHoldingHours: 8.0, strategyVersion: 'v1',
    },
]

export function findPattern(
    pair: string,
    direction: 'buy' | 'sell',
    session: string,
    setup: string,
    timeframe?: string
): PatternRecord | null {
    // Exact match first
    const exact = PATTERN_DATABASE.find(
        (p) =>
            p.pair === pair &&
            p.direction === direction &&
            p.session === session &&
            p.setup === setup &&
            (!timeframe || p.timeframe === timeframe)
    )
    if (exact) return exact

    // Partial match (pair + direction + session)
    const partial = PATTERN_DATABASE.find(
        (p) => p.pair === pair && p.direction === direction && p.session === session
    )
    if (partial) return partial

    // Pair + direction only
    return PATTERN_DATABASE.find(
        (p) => p.pair === pair && p.direction === direction
    ) ?? null
}

export function getTopPatterns(limit = 5): PatternRecord[] {
    return [...PATTERN_DATABASE]
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, limit)
}