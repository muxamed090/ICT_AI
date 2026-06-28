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

    private readonly state: Map<string, MarketData> = new Map()

    private apiKey = process.env.MARKET_API_KEY


    constructor() {

        if (!this.apiKey) {
            throw new Error(
                'MARKET_API_KEY missing in environment'
            )
        }

    }



    async tick(): Promise<void> {


        const requests = SYMBOLS.map(async (symbol) => {


            const url =
                `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.apiKey}`


            const response = await fetch(url)

            const data = await response.json()


            if (!data.close) return


            const price = Number(data.close)

            const mappedSymbol = SYMBOL_MAP[symbol]


            const market: MarketData = {

                symbol: mappedSymbol,

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


                trend:
                    price > Number(data.open)
                        ? 'up'
                        : price < Number(data.open)
                            ? 'down'
                            : 'neutral',


                volatility: 'medium',

                status: 'open',

            }


            this.state.set(
                mappedSymbol,
                market
            )


        })


        await Promise.all(requests)

    }



    getAllData(): MarketData[] {

        return Array.from(
            this.state.values()
        )

    }



    getDataForSymbol(symbol: string) {

        return this.state.get(symbol)

    }



    getSymbols() {

        return Array.from(
            this.state.keys()
        )

    }

}