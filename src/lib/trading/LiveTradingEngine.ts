import { ExecutionRequest, ExecutionResult, TradingState, BrokerConfig } from './types'
import { BrokerConnector } from './core/BrokerConnector'
import { executeTrade } from './core/TradeExecutor'

const DEFAULT_STATE: TradingState = {
    isConnected: false,
    brokerType: 'demo',
    accountBalance: 10000,
    equity: 10000,
    openPositions: [],
    pendingOrders: [],
    todayPnl: 0,
    todayTrades: 0,
    dailyDrawdown: 0,
    maxDailyDrawdown: 5,
}

export class LiveTradingEngine {
    private broker: BrokerConnector
    private state: TradingState

    constructor(brokerConfig?: Partial<BrokerConfig>) {
        this.broker = new BrokerConnector(brokerConfig)
        this.state = { ...DEFAULT_STATE }
    }

    async connect(): Promise<{ success: boolean; message: string }> {
        const result = await this.broker.connect()
        if (result.success) {
            const info = await this.broker.getAccountInfo()
            this.state.isConnected = true
            this.state.brokerType = this.broker.getType()
            this.state.accountBalance = info.balance
            this.state.equity = info.equity
        }
        return result
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        return executeTrade(request, this.state, this.broker)
    }

    getState(): TradingState { return this.state }

    updateBalance(balance: number, equity: number): void {
        this.state.accountBalance = balance
        this.state.equity = equity
        const drawdown = ((balance - equity) / balance) * 100
        this.state.dailyDrawdown = parseFloat(drawdown.toFixed(2))
    }
}