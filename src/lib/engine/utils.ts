export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

export function calcRiskReward(entry: number, stopLoss: number, tp1: number): number {
    const risk = Math.abs(entry - stopLoss)
    const reward = Math.abs(tp1 - entry)
    if (risk === 0) return 0
    return parseFloat((reward / risk).toFixed(2))
}