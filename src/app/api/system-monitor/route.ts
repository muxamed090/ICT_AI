import { NextResponse } from 'next/server'
import { runSystemCheck } from '@/lib/monitor/SystemMonitor'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const apiKey = process.env.MARKET_API_KEY ?? ''
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

        const health = await runSystemCheck(apiKey, supabaseUrl)
        return NextResponse.json({ health })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}