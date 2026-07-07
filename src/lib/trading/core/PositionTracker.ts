import { LivePosition, TradeOrder } from '../types'
import { calcUnrealizedPnl, generateOrderId } from '../utils'

export function orderToPosition(order: TradeOrder, currentPrice: number): LivePosition {
    return {
        id: generateOrderId(),
        pair: order.pair,
        direction: order.direction,
        entryPrice: order.entryPrice,
        currentPrice,
        stopLoss: order.stopLoss,
        tp1: order.tp1,
        tp2: order.tp2,
        positionSizeLots: order.positionSizeLots,
        unrealizedPnl: calcUnrealizedPnl(
            order.direction,
            order.entryPrice,
            currentPrice,
            order.positionSizeLots,
            order.pair
        ),
        riskAmount: order.riskAmount,
        openedAt: new Date().toISOString(),
        status: 'open',
    }
}

export function updatePosition(position: LivePosition, currentPrice: number): LivePosition {
    return {
        ...position,
        currentPrice,
        unrealizedPnl: calcUnrealizedPnl(
            position.direction,
            position.entryPrice,
            currentPrice,
            position.positionSizeLots,
            position.pair
        ),
    }
}

export function calcTotalUnrealizedPnl(positions: LivePosition[]): number {
    return parseFloat(positions.reduce((a, p) => a + p.unrealizedPnl, 0).toFixed(2))
}