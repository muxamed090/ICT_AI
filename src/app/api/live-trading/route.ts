import { NextResponse } from 'next/server'
import { runICTEngine } from '@/lib/engine/ICTEngine'
import { runMLEngine } from '@/lib/ml/MLEngine'
import { runRulesEngine } from '@/lib/rules/RulesEngine'
import { runDecisionEngine } from '@/lib/decision/DecisionEngine'
import { LiveTradingEngine } from '@/lib/trading/LiveTradingEngine'
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

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let riskPercent = 1
        let accountBalance = 10000

        if (user) {
            const settingsRepo = new SettingsRepository(supabase)
            const settings = await settingsRepo.getById(user.id)
            if (settings) riskPercent = settings.risk_percent ?? 1
        }

        // Fetch live prices
        const symbols = 'EUR/USD,XAU/USD,USD/CAD,EUR/JPY'
        const priceRes = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`,
            { next: { revalidate: 30 } }
        )
        const raw = await priceRes.json()
        const quotes: Record<string, unknown>[] = Array.isArray(raw) ? raw : Object.values(raw)

        const session = getCurrentSession()
        const killzone = getKillzoneName() ?? undefined

        // Initialize trading engine
        const tradingEngine = new LiveTradingEngine({ type: 'demo' })
        await tradingEngine.connect()
        const state = tradingEngine.getState()

        // Generate decisions for all pairs
        const signals = quotes
            .filter((q) => q && !q.code)
            .map((q) => {
                const price = parseFloat(q.close as string) || 0
                const open = parseFloat(q.open as string) || price
                const pair = (q.symbol as string).replace('/', '')
                const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
                const direction: 'buy' | 'sell' = price >= open ? 'buy' : 'sell'
                const priceDiff = Math.abs(price - open)
                const score = Math.min(95, Math.round(55 + (priceDiff / open) * 8000))
                const confidence = Math.min(95, Math.round(50 + (priceDiff / open) * 10000))
                const sl = direction === 'buy' ? price - 20 * pip : price + 20 * pip
                const tp1 = direction === 'buy' ? price + 30 * pip : price - 30 * pip
                const tp2 = direction === 'buy' ? price + 60 * pip : price - 60 * pip
                const rr = parseFloat((Math.abs(tp1 - price) / Math.abs(price - sl)).toFixed(2))

                const ictResult = runICTEngine({ pair, direction, price, entry: price, stop_loss: sl, tp1, tp2, score, confidence, hasNewsRisk: false, newsWarning: null })
                const mlResult = runMLEngine({ pair, direction, session, setup: 'BOS+FVG', ictScore: score, ictConfidence: confidence, riskRewardRatio: rr, historicalTrades: [] } as MLInput)
                const rulesResult = runRulesEngine({ pair, direction, price, entry: price, stop_loss: sl, tp1, tp2, score, confidence, session, killzone, timeframe: 'H1', hasNewsRisk: false, newsWarning: null, minutesToNews: 999, htfBias: direction === 'buy' ? 'bullish' : 'bearish', hasBOS: score >= 75, hasCHoCH: score >= 65, hasFVG: confidence >= 70, hasOrderBlock: confidence >= 65, hasLiquiditySweep: score >= 70, spreadPips: 1 } as RuleInput)
                const decision = runDecisionEngine({ pair, direction, price, entry: price, stop_loss: sl, tp1, tp2, ictResult, mlResult, rulesResult, accountBalance, riskPercent } as DecisionInput)

                // Generate trade plan for executable decisions
                let tradePlan = null
                if (decision.action === 'BUY' || decision.action === 'SELL') {
                    tradePlan = {
                        action: decision.action,
                        entry: decision.entry.optimalEntry,
                        stopLoss: decision.stop_loss,
                        tp1: decision.tp1,
                        tp2: decision.tp2,
                        positionSize: decision.risk.positionSizeLots,
                        riskAmount: decision.risk.riskAmount,
                        rewardTP1: decision.risk.rewardTP1,
                        rr: decision.risk.riskRewardTP1,
                        grade: decision.grade,
                        confidence: decision.confidence,
                        executionMode: decision.executionMode,
                    }
                }

                return {
                    pair,
                    direction,
                    price,
                    action: decision.action,
                    grade: decision.grade,
                    confidence: decision.confidence,
                    executionMode: decision.executionMode,
                    tradePlan,
                    ictRec: ictResult.recommendation,
                    mlRec: mlResult.prediction.recommendation,
                    rulesGrade: rulesResult.grade,
                    combinedScore: decision.aggregated.combinedScore,
                }
            })

        return NextResponse.json({
            signals,
            state,
            session,
            killzone: killzone ?? null,
        })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}