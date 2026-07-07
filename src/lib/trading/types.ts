import { DecisionOutput } from '@/lib/decision/types'

export type ExecutionMode = 'manual' | 'semi-auto' | 'auto'
export type OrderStatus = 'pending' | 'open' | 'closed' | 'cancelled' | 'failed'
export type OrderType = 'market' | 'limit' | 'stop'

export interface BrokerConfig {
    type: 'mt4' | 'mt5' | 'demo'
    serverUrl?: string
    accountId?: string
    apiKey?: string
    connected: boolean
}

export interface TradeOrder {
    id: string
    pair: string
    direction: 'buy' | 'sell'
    orderType: OrderType
    entryPrice: number
    stopLoss: number
    tp1: number
    tp2: number
    positionSizeLots: number
    riskAmount: number
    status: OrderStatus
    executionMode: ExecutionMode
    decisionScore: number
    decisionGrade: string
    placedAt?: string
    openedAt?: string
    closedAt?: string
    exitPrice?: number
    pnl?: number
    notes?: string
}

export interface LivePosition {
    id: string
    pair: string
    direction: 'buy' | 'sell'
    entryPrice: number
    currentPrice: number
    stopLoss: number
    tp1: number
    tp2: number
    positionSizeLots: number
    unrealizedPnl: number
    riskAmount: number
    openedAt: string
    status: 'open' | 'closing'
}

export interface TradingState {
    isConnected: boolean
    brokerType: string
    accountBalance: number
    equity: number
    openPositions: LivePosition[]
    pendingOrders: TradeOrder[]
    todayPnl: number
    todayTrades: number
    dailyDrawdown: number
    maxDailyDrawdown: number
}

export interface ExecutionRequest {
    decision: DecisionOutput
    mode: ExecutionMode
    notes?: string
}

export interface ExecutionResult {
    success: boolean
    order?: TradeOrder
    error?: string
    message: string
}