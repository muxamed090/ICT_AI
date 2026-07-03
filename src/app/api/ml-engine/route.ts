import { NextResponse } from 'next/server'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { getCurrentSession } from '@/lib/ml/utils'
import { MLInput } from '@/lib/ml/types'

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
        const session = getCurrentSession()

        const results = quotes
            .filter((q: Record<string, unknown>) => q && !q.code)
            .map((q: Record<string, unknown>) => {
                const price = parseFloat(q.close as string) || parseFloat(q.price as string) || 0
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
                const score = Math.floor(60 + Math.random() * 35)
                const confidence = Math.floor(55 + Math.random() * 40)
                const direction = Math.random() > 0.5 ? 'buy' : 'sell'
                const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip
                const rr = parseFloat((Math.abs(tp1 - price) / Math.abs(price - sl)).toFixed(2))

                // ICT Engine
                const ictResult = runICTEngine({
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    hasNewsRisk: false, newsWarning: null,
                })

                // ML Engine
                const mlInput: MLInput = {
                    pair, direction, session,
                    setup: 'BOS+FVG',
                    ictScore: score,
                    ictConfidence: confidence,
                    riskRewardRatio: rr,
                    historicalTrades: [],
                }
                const mlResult = runMLEngine(mlInput)

                return { pair, direction, price, ictResult, mlResult }
            })

        return NextResponse.json({ results, session })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}