import { TradeOrder, ExecutionMode } from '../types'
import { generateOrderId } from '../utils'
import { DecisionOutput } from '@/lib/decision/types'

export function createOrder(
    decision: DecisionOutput,
    mode: ExecutionMode,
    notes?: string
): TradeOrder {
    return {
        id: generateOrderId(),
        pair: decision.pair,
        direction: decision.direction,
        orderType: 'market',
        entryPrice: decision.entry.optimalEntry,
        stopLoss: decision.stop_loss,
        tp1: decision.tp1,
        tp2: decision.tp2,
        positionSizeLots: decision.risk.positionSizeLots,
        riskAmount: decision.risk.riskAmount,
        status: 'pending',
        executionMode: mode,
        decisionScore: decision.confidence,
        decisionGrade: decision.grade,
        placedAt: new Date().toISOString(),
        notes,
    }
}

export function updateOrderStatus(
    order: TradeOrder,
    status: TradeOrder['status'],
    exitPrice?: number
): TradeOrder {
    const updated: TradeOrder = { ...order, status }
    if (exitPrice) {
        updated.exitPrice = exitPrice
        updated.closedAt = new Date().toISOString()
        const pip = order.pair.includes('JPY') || order.pair.includes('XAU') ? 0.01 : 0.0001
        const pipValue = pip * 100000 * order.positionSizeLots
        const pips = order.direction === 'buy'
            ? (exitPrice - order.entryPrice) / pip
            : (order.entryPrice - exitPrice) / pip
        updated.pnl = parseFloat((pips * pipValue).toFixed(2))
    }
    return updated
}