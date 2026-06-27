import {
  AccountSummary,
  ExecutionReceipt,
  BrokerPosition,
} from '@/types/database'

export interface BrokerAdapter {
  /** Opens connection session with the broker environment */
  connect(): Promise<boolean>
  
  /** Closes the active broker session */
  disconnect(): Promise<void>
  
  /** Retrieves live account statistics (Balance, Equity, Margins) */
  getAccountSummary(): Promise<AccountSummary>
  
  /** Routes an order to the execution gateway */
  executeOrder(order: {
    pair: string
    direction: 'buy' | 'sell'
    lot_size: number
    requested_price: number
    stop_loss: number
    take_profit: number
  }): Promise<ExecutionReceipt>
  
  /** Closes an active trade position via ticket/ID */
  closePosition(ticket: string): Promise<boolean>
  
  /** Modifies SL/TP constraints of an active position */
  modifyPosition(ticket: string, sl: number, tp: number): Promise<boolean>
  
  /** Fetches all open positions on the account */
  getOpenPositions(): Promise<Omit<BrokerPosition, 'id' | 'user_id' | 'broker_account_id'>[]>
}
