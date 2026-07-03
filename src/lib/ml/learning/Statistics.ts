import { TradeRecord } from '../types'
import { average } from '../utils'

export function getPairStats(trades: TradeRecord[]): Record<string, { winRate: number; avgRR: number; total: number }> {
    const map: Record<string, TradeRecord[]> = {}
    trades.forEach((t) => {
        if (!map[t.pair]) map[t.pair] = []
        map[t.pair].push(t)
    })
    const result: Record<string, { winRate: number; avgRR: number; total: number }> = {}
    Object.entries(map).forEach(([pair, ts]) => {
        const wins = ts.filter((t) => t.outcome === 'win').length
        result[pair] = {
            winRate: Math.round((wins / ts.length) * 100),
            avgRR: parseFloat(average(ts.map((t) => t.rr_achieved)).toFixed(2)),
            total: ts.length,
        }
    })
    return result
}

export function getSessionStats(trades: TradeRecord[]): Record<string, { winRate: number; total: number }> {
    const map: Record<string, TradeRecord[]> = {}
    trades.forEach((t) => {
        if (!map[t.session]) map[t.session] = []
        map[t.session].push(t)
    })
    const result: Record<string, { winRate: number; total: number }> = {}
    Object.entries(map).forEach(([session, ts]) => {
        const wins = ts.filter((t) => t.outcome === 'win').length
        result[session] = {
            winRate: Math.round((wins / ts.length) * 100),
            total: ts.length,
        }
    })
    return result
}