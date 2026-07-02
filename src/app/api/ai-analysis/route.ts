import { NextResponse } from 'next/server'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { SignalInput } from '@/lib/engine/types'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const apiKey = process.env.MARKET_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

        const symbols = 'EUR/USD,XAU/USD,USD/CAD,EUR/JPY'
        const priceRes = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`,
            { next: { revalidate: 30 } }
        )
        const raw = await priceRes.json()
        const quotes: Record<string, unknown>[] = Array.isArray(raw) ? raw : Object.values(raw)

        const analyses = quotes
            .filter((q: Record<string, unknown>) => q && !q.code)
            .map((q: Record<string, unknown>) => {
                const price = parseFloat(q.close as string) || parseFloat(q.price as string) || 0
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
                const score = Math.floor(60 + Math.random() * 35)
                const confidence = Math.floor(55 + Math.random() * 40)
                const trend = Math.random() > 0.5 ? 'buy' : 'sell'
                const sl = trend === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = trend === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = trend === 'buy' ? price + 60 * pip : price - 60 * pip

                const signal: SignalInput = {
                    pair,
                    direction: trend,
                    price,
                    entry: price,
                    stop_loss: sl,
                    tp1,
                    tp2,
                    score,
                    confidence,
                    hasNewsRisk: false,
                    newsWarning: null,
                }

                return runICTEngine(signal)
            })

        return NextResponse.json({ analyses })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}