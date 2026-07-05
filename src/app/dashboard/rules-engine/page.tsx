import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageTitle from '@/components/widgets/PageTitle'
import RulesEnginePanel from '@/components/dashboard/RulesEnginePanel'

export const dynamic = 'force-dynamic'

export default async function RulesEnginePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    let results: unknown[] = []
    let session = 'london'
    let killzone: string | null = null

    try {
        const { GET } = await import('@/app/api/rules-engine/route')
        const res = await GET()
        const data = await res.json()
        results = Array.isArray(data.results) ? data.results : []
        session = data.session ?? 'london'
        killzone = data.killzone ?? null
    } catch (err) {
        console.error('Rules Engine error:', err)
    }

    return (
        <div className="space-y-6">
            <PageTitle
                title="Rules Engine"
                subtitle="ICT Premium Rules — Session, Killzone, News, Liquidity, Structure & Multi-Timeframe validation."
            />
            <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-5">
                <RulesEnginePanel
                    results={results as never}
                    session={session}
                    killzone={killzone}
                />
            </div>
        </div>
    )
}