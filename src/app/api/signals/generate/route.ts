import { NextResponse } from 'next/server'

const CURRENCY_MAP: Record<string, string[]> = {
    USD: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD', 'NZDUSD'],
    EUR: ['EURUSD', 'EURJPY'],
    GBP: ['GBPUSD'],
    JPY: ['USDJPY', 'EURJPY'],
    XAU: ['XAUUSD'],
    BTC: ['BTCUSD'],
    AUD: ['AUDUSD'],
    CAD: ['USDCAD'],
    NZD: ['NZDUSD'],
    CHF: ['USDCHF'],
}

interface NewsEvent {
    country: string
    impact: string
    date: string
    title: string
}

interface MarketQuote {
    symbol: string
    close: string
    open: string
    high: string
    low: string
}

export async function GET() {
    const apiKey = process.env.MARKET_API_KEY

    // 1. Fetch live news
    let newsEvents: NewsEvent[] = []
    try {
        const newsRes = await fetch(
            'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
            { cache: 'no-store' }
        )
        if (newsRes.ok) newsEvents = await newsRes.json()
    } catch { newsEvents = [] }

    // 2. Fetch live prices
    // 2. Fetch live prices
    const symbols = 'EUR/USD,XAU/USD,USD/CAD,EUR/JPY'
    let quotes: MarketQuote[] = []
    let priceDebug: Record<string, unknown> = {}
    if (apiKey) {
        try {
            const priceRes = await fetch(
                `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`,
                { next: { revalidate: 30 } }
            )
            const raw = await priceRes.json()
            priceDebug = { status: priceRes.status, ok: priceRes.ok, rawSample: raw }
            if (priceRes.ok) {
                quotes = Array.isArray(raw) ? raw : Object.values(raw)
            }
        } catch (err) {
            priceDebug = { error: String(err) }
        }
    } else {
        priceDebug = { error: 'no api key' }
    }

    // 3. Check upcoming high-impact news (next 60 min)
    const now = new Date()
    const in60 = new Date(now.getTime() + 60 * 60 * 1000)

    const upcomingHigh = newsEvents.filter((e) => {
        const t = new Date(e.date)
        return t >= now && t <= in60 && e.impact?.toLowerCase() === 'high'
    })

    // 4. Generate signals
    const signals = quotes.map((q) => {
        const displaySymbol = q.symbol?.replace('/', '') ?? ''
        const price = Number(q.close)
        const open = Number(q.open)

        if (!price || !open) return null

        const trend = price > open ? 'buy' : 'sell'
        const priceDiff = Math.abs(price - open)
        const baseConfidence = Math.min(95, 50 + (priceDiff / open) * 10000)
        const baseScore = Math.min(95, 55 + (priceDiff / open) * 8000)

        // Check if this pair has upcoming high news
        const affectedCurrencies = upcomingHigh.map((e) => e.country?.toUpperCase())
        const hasNewsRisk = affectedCurrencies.some((currency) =>
            (CURRENCY_MAP[currency] ?? []).includes(displaySymbol)
        )

        const newsWarning = upcomingHigh.find((e) =>
            (CURRENCY_MAP[e.country?.toUpperCase()] ?? []).includes(displaySymbol)
        )

        // Reduce confidence if news risk
        const confidence = hasNewsRisk ? Math.max(20, baseConfidence - 35) : baseConfidence
        const score = hasNewsRisk ? Math.max(20, baseScore - 30) : baseScore
        const recommendation = hasNewsRisk ? 'WAIT' : score >= 70 ? 'ENTRY' : score >= 55 ? 'WATCH' : 'WAIT'

        const pip = displaySymbol.includes('JPY') ? 0.01 : displaySymbol === 'XAUUSD' ? 0.1 : displaySymbol === 'BTCUSD' ? 10 : 0.0001
        const slPips = 20
        const tp1Pips = 30
        const tp2Pips = 60

        const sl = trend === 'buy' ? price - slPips * pip : price + slPips * pip
        const tp1 = trend === 'buy' ? price + tp1Pips * pip : price - tp1Pips * pip
        const tp2 = trend === 'buy' ? price + tp2Pips * pip : price - tp2Pips * pip

        return {
            pair: displaySymbol,
            direction: trend,
            price,
            entry: price,
            stop_loss: sl,
            tp1,
            tp2,
            score: Math.round(score),
            confidence: Math.round(confidence),
            recommendation,
            hasNewsRisk,
            newsWarning: newsWarning ? `⚠️ ${newsWarning.title} (${newsWarning.country}) in ${Math.round((new Date(newsWarning.date).getTime() - now.getTime()) / 60000)} min` : null,
            trend: price > open ? 'up' : 'down',
        }
    }).filter(Boolean)

    return NextResponse.json({
        signals,
        debug: {
            hasApiKey: !!apiKey,
            quotesCount: quotes.length,
            newsCount: newsEvents.length,
            priceDebug,
        },
        upcomingHighNews: upcomingHigh.map((e) => ({
            title: e.title,
            country: e.country,
            impact: e.impact,
            date: e.date,
            minutesUntil: Math.round((new Date(e.date).getTime() - now.getTime()) / 60000),
        })),
        generatedAt: now.toISOString(),
    })
}