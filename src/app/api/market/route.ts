import { NextResponse } from 'next/server'

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY', 'XAU/USD', 'BTC/USD']

export async function GET() {
    const apiKey = process.env.MARKET_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'API key missing' }, { status: 500 })
    }

    const results = await Promise.all(
        SYMBOLS.map(async (symbol) => {
            const res = await fetch(
                `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
                { next: { revalidate: 15 } }
            )
            return res.json()
        })
    )

    return NextResponse.json(results)
}