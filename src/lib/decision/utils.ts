export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

export function toPips(pair: string, priceDiff: number): number {
    const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
    return parseFloat((Math.abs(priceDiff) / pip).toFixed(1))
}

export function getPip(pair: string): number {
    if (pair.includes('JPY')) return 0.01
    if (pair.includes('XAU')) return 0.1
    if (pair.includes('BTC')) return 1
    return 0.0001
}