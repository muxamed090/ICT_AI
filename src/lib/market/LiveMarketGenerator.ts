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


        const apiKey = process.env.MARKET_API_KEY


        if (!apiKey) {
            console.error("API KEY missing")
            return
        }


        const requests = SYMBOLS.map(async (symbol) => {


            const url =
                `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`


            const res = await fetch(url)

            const data = await res.json()


            if (!data.close) return


            const price = Number(data.close)


            const market: MarketData = {

                symbol: SYMBOL_MAP[symbol],

                bid: price,

                ask: price,

                spread: 0,

                open: Number(data.open),

                high: Number(data.high),

                low: Number(data.low),

                close: price,

                volume: Number(data.volume ?? 0),

                timeframe: "LIVE",

                lastUpdate: new Date().toISOString(),

                trend:
                    price > Number(data.open)
                        ? "up"
                        : price < Number(data.open)
                            ? "down"
                            : "neutral",

                volatility: "medium",

                status: "open"

            }


            this.state.set(
                SYMBOL_MAP[symbol],
                market
            )


        })


        await Promise.all(requests)


    }



    getAllData() {

        return Array.from(this.state.values())

    }


}