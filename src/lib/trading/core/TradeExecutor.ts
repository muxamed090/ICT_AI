import { ExecutionRequest, ExecutionResult, TradingState } from '../types'
import { createOrder } from './OrderManager'
import { checkRisk } from './RiskGuard'
import { BrokerConnector } from './BrokerConnector'

export async function executeTrade(
    request: ExecutionRequest,
    state: TradingState,
    broker: BrokerConnector
): Promise<ExecutionResult> {
    const { decision, mode, notes } = request

    // 1. Only execute BUY/SELL decisions
    if (decision.action !== 'BUY' && decision.action !== 'SELL') {
        return {
            success: false,
            message: 'Decision is ' + decision.action + ' — not executable',
        }
    }

    // 2. Risk check
    const riskCheck = checkRisk(state, decision.risk.riskAmount, decision.pair)
    if (!riskCheck.approved) {
        return {
            success: false,
            message: 'Risk check failed: ' + riskCheck.reason,
        }
    }

    // 3. Create order
    const order = createOrder(decision, mode, notes)

    // 4. Manual mode — return order plan only
    if (mode === 'manual') {
        return {
            success: true,
            order: { ...order, status: 'pending' },
            message: 'Trade plan ready — execute manually in MT4/MT5',
        }
    }

    // 5. Semi-Auto / Auto — submit to broker
    if (!broker.isConnected()) {
        return {
            success: false,
            message: 'Broker not connected — switch to Manual mode',
        }
    }

    // Demo execution
    const executedOrder = { ...order, status: 'open' as const, openedAt: new Date().toISOString() }
    return {
        success: true,
        order: executedOrder,
        message: 'Order executed: ' + order.direction.toUpperCase() + ' ' + order.pair + ' @ ' + order.entryPrice.toFixed(5),
    }
}