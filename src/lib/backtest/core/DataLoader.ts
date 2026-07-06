import { Candle } from '../types'

// Generate synthetic historical candles based on real price
export function generateHistoricalCandles(
    pair: string,
    basePrice: number,
    days: number
): Candle[] {
    const candles: Candle[] = []
    const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
    const volatility = pair.includes('XAU') ? 2 : pair.includes('JPY') ? 0.3 : 0.001

    let price = basePrice
    const now = new Date()

    for (let i = days; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue

        // Generate 4 candles per day (4H timeframe simulation)
        for (let h = 0; h < 4; h++) {
            const candleDate = new Date(date)
            candleDate.setHours(h * 6)

            const change = (Math.random() - 0.48) * volatility
            const open = price
            const close = parseFloat((price + change).toFixed(5))
            const high = parseFloat((Math.max(open, close) + Math.random() * volatility * 0.5).toFixed(5))
            const low = parseFloat((Math.min(open, close) - Math.random() * volatility * 0.5).toFixed(5))

            candles.push({
                timestamp: candleDate.toISOString(),
                open,
                high,
                low,
                close,
                volume: Math.floor(1000 + Math.random() * 9000),
            })

            price = close
        }
    }

    return candles
}

export async function loadLivePriceForBacktest(
    pair: string,
    apiKey: string
): Promise<number> {
    try {
        const symbol = pair.slice(0, 3) + '/' + pair.slice(3)
        const res = await fetch(
            `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
            { next: { revalidate: 60 } }
        )
        const data = await res.json()
        return parseFloat(data.price) || 0
    } catch {
        return 0
    }
}