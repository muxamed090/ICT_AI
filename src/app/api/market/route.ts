import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const apiKey = process.env.MARKET_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'API key missing' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols') ?? 'EUR/USD,GBP/USD,USD/JPY,EUR/JPY,XAU/USD,BTC/USD'
    const symbols = symbolsParam.split(',')

    const results = await Promise.all(
        symbols.map(async (symbol) => {
            const res = await fetch(
                `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol.trim())}&apikey=${apiKey}`,
                { next: { revalidate: 15 } }
            )
            return res.json()
        })
    )

    return NextResponse.json(results)
}