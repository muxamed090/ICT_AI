export type StatusLevel = 'healthy' | 'warning' | 'error' | 'unknown'

export interface StatusCheck {
    name: string
    status: StatusLevel
    message: string
    responseTime?: number
    lastChecked: string
    details?: Record<string, unknown>
}

export interface EngineStatus {
    ictEngine: StatusCheck
    mlEngine: StatusCheck
    rulesEngine: StatusCheck
    decisionEngine: StatusCheck
}

export interface APIStatus {
    twelveData: StatusCheck
    forexFactory: StatusCheck
    supabase: StatusCheck
}

export interface BrokerStatus {
    connection: StatusCheck
    type: string
    accountId?: string
}

export interface PerformanceMetrics {
    avgResponseTime: number
    totalRequests: number
    errorRate: number
    uptime: number
}

export interface SystemHealth {
    overall: StatusLevel
    engines: EngineStatus
    apis: APIStatus
    broker: BrokerStatus
    performance: PerformanceMetrics
    checkedAt: string
}