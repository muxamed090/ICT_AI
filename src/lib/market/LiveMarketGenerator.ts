import { MarketData } from './MarketDataTypes'

const SYMBOLS = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'EUR/JPY',
    'XAU/USD',
    'BTC/USD',
]

const SYMBOL_MAP: Record<string, string> = {
    'EUR/USD': 'EURUSD',
    'GBP/USD': 'GBPUSD',
    'USD/JPY': 'USDJPY',
    'EUR/JPY': 'EURJPY',
    'XAU/USD': 'XAUUSD',
    'BTC/USD': 'BTCUSD',
}

export class LiveMarketGenerator {

    private state = new Map<string, MarketData>()

    async tick(): Promise<void> {
        const res = await fetch('/api/market')
        const dataArr = await res.json()

        dataArr.forEach((data: Record<string, string>) => {
            if (!data.close || !data.symbol) return
            const price = Number(data.close)
            const mapped = SYMBOL_MAP[data.symbol]
            if (!mapped) return

            this.state.set(mapped, {
                symbol: mapped,
                bid: price,
                ask: price,
                spread: 0,
                open: Number(data.open),
                high: Number(data.high),
                low: Number(data.low),
                close: price,
                volume: Number(data.volume ?? 0),
                timeframe: 'LIVE',
                lastUpdate: new Date().toISOString(),
                trend: price > Number(data.open) ? 'up' : price < Number(data.open) ? 'down' : 'neutral',
                volatility: 'medium',
                status: 'open',
            })
        })
    }

    getAllData() {
        return Array.from(this.state.values())
    }

}