import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const res = await fetch(
            'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
            { next: { revalidate: 3600 } }
        )
        const data = await res.json()

        const mapped = data.map((e: Record<string, string>, i: number) => ({
            id: `ff-${i}`,
            event_name: e.title ?? e.name ?? 'Unknown Event',
            currency: e.country ?? '',
            event_time: e.date ?? new Date().toISOString(),
            impact: mapImpact(e.impact),
            forecast: e.forecast ?? null,
            previous: e.previous ?? null,
            actual: e.actual ?? null,
        }))

        return NextResponse.json(mapped)
    } catch {
        return NextResponse.json([], { status: 500 })
    }
}

function mapImpact(impact: string): 'high' | 'medium' | 'low' {
    if (!impact) return 'low'
    const v = impact.toLowerCase()
    if (v === 'high') return 'high'
    if (v === 'medium' || v === 'moderate') return 'medium'
    return 'low'
}