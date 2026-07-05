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

export async function GET() {
    try {
        const apiKey = process.env.MARKET_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

        // Get user settings for risk management
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let accountBalance = 10000
        let riskPercent = 1

        if (user) {
            const settingsRepo = new SettingsRepository(supabase)
            const settings = await settingsRepo.getById(user.id)
            if (settings) {
                riskPercent = settings.risk_percent ?? 1
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
        const killzone = getKillzoneName() ?? undefined

        const decisions = quotes
            .filter((q) => q && !q.code)
            .map((q) => {
                const price = parseFloat(q.close as string) || 0
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
                const direction = Math.random() > 0.5 ? 'buy' : 'sell'
                const score = Math.floor(60 + Math.random() * 35)
                const confidence = Math.floor(55 + Math.random() * 40)
                const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip
                const rr = parseFloat((Math.abs(tp1 - price) / Math.abs(price - sl)).toFixed(2))

                // 1. ICT Engine
                const ictResult = runICTEngine({
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    hasNewsRisk: false, newsWarning: null,
                })

                // 2. ML Engine
                const mlInput: MLInput = {
                    pair, direction, session,
                    setup: 'BOS+FVG',
                    ictScore: score,
                    ictConfidence: confidence,
                    riskRewardRatio: rr,
                    historicalTrades: [],
                }
                const mlResult = runMLEngine(mlInput)

                // 3. Rules Engine
                const ruleInput: RuleInput = {
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2, score, confidence,
                    session, killzone, timeframe: 'H1',
                    hasNewsRisk: false, newsWarning: null,
                    minutesToNews: 999,
                    htfBias: direction === 'buy' ? 'bullish' : 'bearish',
                    hasBOS: Math.random() > 0.3,
                    hasCHoCH: Math.random() > 0.5,
                    hasFVG: Math.random() > 0.4,
                    hasOrderBlock: Math.random() > 0.4,
                    hasLiquiditySweep: Math.random() > 0.3,
                    spreadPips: Math.floor(Math.random() * 3),
                }
                const rulesResult = runRulesEngine(ruleInput)

                // 4. Decision Engine
                const decisionInput: DecisionInput = {
                    pair, direction, price, entry: price,
                    stop_loss: sl, tp1, tp2,
                    ictResult, mlResult, rulesResult,
                    accountBalance, riskPercent,
                }
                const decision = runDecisionEngine(decisionInput)

                return decision
            })

        return NextResponse.json({ decisions, session, killzone: killzone ?? null })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}