export function generateOrderId(): string {
    return 'ord-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
}

export function calcUnrealizedPnl(
    direction: 'buy' | 'sell',
    entryPrice: number,
    currentPrice: number,
    lots: number,
    pair: string
): number {
    const pip = pair.includes('JPY') || pair.includes('XAU') ? 0.01 : 0.0001
    const pipValue = pip * 100000 * lots
    const pips = direction === 'buy'
        ? (currentPrice - entryPrice) / pip
        : (entryPrice - currentPrice) / pip
    return parseFloat((pips * pipValue).toFixed(2))
}

export function formatPrice(price: number, pair: string): string {
    if (pair.includes('JPY')) return price.toFixed(3)
    if (pair.includes('XAU')) return price.toFixed(2)
    return price.toFixed(5)
}