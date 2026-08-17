import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { JournalEngine } from '@/lib/journal/JournalEngine'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const engine = new JournalEngine(supabase)

        const [trades, stats, sessionStats, pairStats, performance] = await Promise.all([
            engine.getAll(user.id),
            engine.getStats(user.id),
            engine.getSessionStats(user.id),
            engine.getPairStats(user.id),
            engine.getPerformance(user.id),
        ])

        return NextResponse.json({ trades, stats, sessionStats, pairStats, performance })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const engine = new JournalEngine(supabase)

        // Delete
        if (body.action === 'delete' && body.id) {
            await engine.delete(body.id)
            return NextResponse.json({ success: true })
        }

        // Update
        if (body.action === 'update' && body.id) {
            await engine.update(body.id, body.updates)
            return NextResponse.json({ success: true })
        }

        // AI Review
        if (body.action === 'review' && body.id) {
            const review = await engine.reviewTrade(body.id)
            return NextResponse.json({ review })
        }

        // Log new trade
        const entry = await engine.log({ ...body, user_id: user.id })
        return NextResponse.json({ entry })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}