import { NextResponse } from 'next/server'
import { runRulesEngine } from '@/lib/rules/RulesEngine'
import { RuleInput } from '@/lib/rules/types'
import { getCurrentSession } from '@/lib/ml/utils'
import { getKillzoneName } from '@/lib/rules/utils'

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
        const killzone = getKillzoneName() ?? undefined

        const results = quotes
            .filter((q) => q && !q.code)
            .map((q) => {
                const price = parseFloat(q.close as string) || 0
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
                const direction = Math.random() > 0.5 ? 'buy' : 'sell'
                const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip

                const input: RuleInput = {
                    pair,
                    direction,
                    price,
                    entry: price,
                    stop_loss: sl,
                    tp1,
                    tp2,
                    score: Math.floor(60 + Math.random() * 35),
                    confidence: Math.floor(55 + Math.random() * 40),
                    session,
                    killzone,
                    timeframe: 'H1',
                    hasNewsRisk: false,
                    newsWarning: null,
                    minutesToNews: 999,
                    htfBias: direction === 'buy' ? 'bullish' : 'bearish',
                    hasBOS: Math.random() > 0.3,
                    hasCHoCH: Math.random() > 0.5,
                    hasFVG: Math.random() > 0.4,
                    hasOrderBlock: Math.random() > 0.4,
                    hasLiquiditySweep: Math.random() > 0.3,
                    spreadPips: Math.floor(Math.random() * 3),
                }

                const rulesResult = runRulesEngine(input)
                return { pair, direction, price, input, rulesResult }
            })

        return NextResponse.json({ results, session, killzone: killzone ?? null })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}