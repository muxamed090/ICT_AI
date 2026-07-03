import { TradeRecord } from '../types'

export function learnFromOutcome(
    existing: TradeRecord[],
    newTrade: TradeRecord
): TradeRecord[] {
    // Haddii trade-ku horey u jiro, update gareey
    const idx = existing.findIndex((t) => t.id === newTrade.id)
    if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = newTrade
        return updated
    }
    return [...existing, newTrade]
}

export function getSetupStats(
    trades: TradeRecord[]
): Record<string, { winRate: number; avgRR: number; total: number }> {
    const map: Record<string, TradeRecord[]> = {}
    trades.forEach((t) => {
        if (!map[t.setup]) map[t.setup] = []
        map[t.setup].push(t)
    })
    const result: Record<string, { winRate: number; avgRR: number; total: number }> = {}
    Object.entries(map).forEach(([setup, ts]) => {
        const wins = ts.filter((t) => t.outcome === 'win').length
        const avgRR = ts.reduce((a, t) => a + t.rr_achieved, 0) / ts.length
        result[setup] = {
            winRate: Math.round((wins / ts.length) * 100),
            avgRR: parseFloat(avgRR.toFixed(2)),
            total: ts.length,
        }
    })
    return result
}