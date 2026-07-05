import { NextResponse } from 'next/server'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { getCurrentSession } from '@/lib/ml/utils'
import { MLInput } from '@/lib/ml/types'
import { createClient } from '@/lib/supabase/server'
import { MLPatternRepository } from '@/lib/repositories/MLPatternRepository'
import { MLTradeRepository } from '@/lib/repositories/MLTradeRepository'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const apiKey = process.env.MARKET_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

        // Get user
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Get real patterns from Supabase (if user logged in)
        let supabasePatterns: Record<string, { winRate: number; avgRR: number; total: number }> = {}
        if (user) {
            const patternRepo = new MLPatternRepository(supabase)
            const tradeRepo = new MLTradeRepository(supabase)

            const [patterns, trades] = await Promise.all([
                patternRepo.getAll(user.id),
                tradeRepo.getByUser(user.id),
            ])

            // Build pattern map from Supabase
            patterns.forEach((p) => {
                const key = p.pair + '_' + p.direction + '_' + p.session
                supabasePatterns[key] = {
                    winRate: p.win_rate,
                    avgRR: p.avg_rr,
                    total: p.trades,
                }
            })

            // Auto-update patterns from closed trades
            if (trades.length > 0) {
                const closedTrades = trades.filter((t) => t.outcome !== 'pending')
                const groupMap: Record<string, typeof closedTrades> = {}
                closedTrades.forEach((t) => {
                    const key = t.pair + '_' + t.direction + '_' + t.session + '_' + t.setup
                    if (!groupMap[key]) groupMap[key] = []
                    groupMap[key].push(t)
                })
                await Promise.all(
                    Object.entries(groupMap).map(([, group]) => {
                        const wins = group.filter((t) => t.outcome === 'win').length
                        const avgRR = group.reduce((a, t) => a + (t.rr_achieved ?? 0), 0) / group.length
                        const avgHours = group.reduce((a, t) => a + (t.holding_hours ?? 0), 0) / group.length
                        return patternRepo.upsertFromTrades(
                            user.id,
                            group[0].pair,
                            group[0].direction,
                            group[0].session,
                            group[0].setup,
                            group[0].timeframe,
                            group.length,
                            wins,
                            parseFloat(avgRR.toFixed(2)),
                            parseFloat(avgHours.toFixed(1))
                        )
                    })
                )
            }
        }

        // Fetch prices
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

                // Check Supabase pattern first
                const patternKey = pair + '_' + direction + '_' + session
                const supabasePattern = supabasePatterns[patternKey]

                const ictResult = runICTEngine({
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    hasNewsRisk: false, newsWarning: null,
                })

                const mlInput: MLInput = {
                    pair, direction, session,
                    setup: 'BOS+FVG',
                    ictScore: score,
                    ictConfidence: confidence,
                    riskRewardRatio: rr,
                    historicalTrades: [],
                }
                const mlResult = runMLEngine(mlInput)

                // Override with real Supabase pattern if available
                if (supabasePattern && supabasePattern.total >= 3) {
                    mlResult.prediction.expectedWinRate = supabasePattern.winRate
                    mlResult.prediction.expectedRR = supabasePattern.avgRR
                    mlResult.prediction.reasons.unshift(
                        '🗄️ Real DB: ' + supabasePattern.total + ' trades — Win Rate ' + supabasePattern.winRate + '%'
                    )
                }

                return { pair, direction, price, ictResult, mlResult }
            })

        return NextResponse.json({ results, session })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}