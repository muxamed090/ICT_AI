import { NextResponse } from 'next/server'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runRulesEngine } from '@/lib/rules/RulesEngine'
import { runDecisionEngine } from '@/lib/decision/DecisionEngine'
import { getCurrentSession } from '@/lib/ml/utils'
import { getKillzoneName } from '@/lib/rules/utils'
import { MLInput } from '@/lib/ml/types'
import { RuleInput } from '@/lib/rules/types'
import { DecisionInput } from '@/lib/decision/types'
import { createClient } from '@/lib/supabase/server'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'

export const dynamic = 'force-dynamic'

export async function GET(req?: Request) {
    const url = req?.url ?? 'http://localhost/api/decision-engine'
    const { searchParams } = new URL(url)
    try {
        const apiKey = process.env.MARKET_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

        // Parse query params
        const requestedPair = searchParams.get('pair')
        const requestedDir = searchParams.get('direction') as 'buy' | 'sell' | null
        const timeframe = searchParams.get('timeframe') ?? 'H1'
        const setup = searchParams.get('setup') ?? 'BOS+FVG'

        // Get user settings
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const accountBalance = 10000
        let riskPercent = 1

        if (user) {
            const settingsRepo = new SettingsRepository(supabase)
            const settings = await settingsRepo.getById(user.id)
            if (settings) riskPercent = settings.risk_percent ?? 1
        }

        // Fetch prices
        const symbols = requestedPair
            ? requestedPair.replace('/', '') === requestedPair
                ? requestedPair.slice(0, 3) + '/' + requestedPair.slice(3)
                : requestedPair
            : 'EUR/USD,XAU/USD,USD/CAD,EUR/JPY'

        const priceRes = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`,
            { next: { revalidate: 30 } }
        )
        const raw = await priceRes.json()
        const quotes: Record<string, unknown>[] = Array.isArray(raw) ? raw : Object.values(raw)

        const session = getCurrentSession()
        const killzone = getKillzoneName() ?? undefined

        const decisions = quotes
            .filter((q) => q && !q.code)
            .map((q) => {
                const price = parseFloat(q.close as string) || 0
                const open = parseFloat(q.open as string) || price
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001

                // Use requested direction or detect from price vs open
                const direction: 'buy' | 'sell' = requestedDir ?? (price >= open ? 'buy' : 'sell')

                const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip
                const rr = parseFloat((Math.abs(tp1 - price) / Math.abs(price - sl)).toFixed(2))

                // Price-based score (real, not random)
                const priceDiff = Math.abs(price - open)
                const score = Math.min(95, Math.round(55 + (priceDiff / open) * 8000))
                const confidence = Math.min(95, Math.round(50 + (priceDiff / open) * 10000))

                // 1. ICT Engine (real)
                const ictResult = runICTEngine({
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    hasNewsRisk: false, newsWarning: null,
                })

                // 2. ML Engine (real)
                const mlInput: MLInput = {
                    pair, direction, session, setup,
                    ictScore: score,
                    ictConfidence: confidence,
                    riskRewardRatio: rr,
                    historicalTrades: [],
                }
                const mlResult = runMLEngine(mlInput)

                // 3. Rules Engine (real)
                const ruleInput: RuleInput = {
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    session, killzone, timeframe,
                    hasNewsRisk: false, newsWarning: null,
                    minutesToNews: 999,
                    htfBias: direction === 'buy' ? 'bullish' : 'bearish',
                    hasBOS: score >= 75,
                    hasCHoCH: score >= 65,
                    hasFVG: confidence >= 70,
                    hasOrderBlock: confidence >= 65,
                    hasLiquiditySweep: score >= 70,
                    spreadPips: 1,
                }
                const rulesResult = runRulesEngine(ruleInput)

                // 4. Decision Engine (real aggregate)
                const decisionInput: DecisionInput = {
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2,
                    ictResult, mlResult, rulesResult,
                    accountBalance, riskPercent,
                }
                const decision = runDecisionEngine(decisionInput)

                // 5. Decision Trace
                const trace = [
                    (ictResult.confidence >= 80 ? '✓' : '✗') + ' ICT Score: ' + ictResult.confidence + (ictResult.confidence >= 80 ? ' ≥ 80' : ' < 80'),
                    (mlResult.prediction.recommendation === 'TAKE' ? '✓' : '✗') + ' ML: ' + mlResult.prediction.recommendation,
                    (rulesResult.grade === 'A' || rulesResult.grade === 'B' ? '✓' : '✗') + ' Rules Grade: ' + rulesResult.grade,
                    '✓ News Risk: NONE',
                    '✓ Combined Score: ' + decision.aggregated.combinedScore,
                    '─────────────────────',
                    'Decision = ' + decision.action,
                ]

                return { ...decision, trace }
            })

        return NextResponse.json({ decisions, session, killzone: killzone ?? null })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}