'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignalsRefresh({ intervalSeconds = 15 }: { intervalSeconds?: number }) {
    const router = useRouter()

    useEffect(() => {
        const id = setInterval(() => {
            router.refresh()
        }, intervalSeconds * 1000)
        return () => clearInterval(id)
    }, [router, intervalSeconds])

    return (
        <p className="text-[10px] text-slate-500 text-right font-mono">
            ↻ Auto-refresh every {intervalSeconds}s
        </p>
    )
}