import { NextResponse } from 'next/server'
import { runBacktest } from '@/lib/backtest/BacktestEngine'
import { BacktestConfig } from '@/lib/backtest/types'

export const dynamic = 'force-dynamic'

export async function GET(req?: Request) {
    try {
        const apiKey = process.env.MARKET_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

        const url = req?.url ?? 'http://localhost/api/backtest'
        const { searchParams } = new URL(url)

        const pair = searchParams.get('pair') ?? 'EURUSD'
        const direction = (searchParams.get('direction') ?? 'both') as 'buy' | 'sell' | 'both'
        const timeframe = searchParams.get('timeframe') ?? 'H1'
        const setup = searchParams.get('setup') ?? 'BOS+FVG'
        const balance = parseFloat(searchParams.get('balance') ?? '10000')
        const risk = parseFloat(searchParams.get('risk') ?? '1')

        // Get live price as base
        const symbol = pair.slice(0, 3) + '/' + pair.slice(3)
        const priceRes = await fetch(
            `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
            { next: { revalidate: 60 } }
        )
        const priceData = await priceRes.json()
        const basePrice = parseFloat(priceData.price) || 1.1

        const config: BacktestConfig = {
            pair,
            direction,
            timeframe,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            accountBalance: balance,
            riskPercent: risk,
            setup,
        }

        const report = await runBacktest(config, basePrice)
        return NextResponse.json({ report })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}