import { ExecutionReceipt } from '@/types/database'
import { BrokerAdapter } from './BrokerAdapter'

type OrderPayload = {
  pair: string
  direction: 'buy' | 'sell'
  lot_size: number
  requested_price: number
  stop_loss: number
  take_profit: number
}

type RetryableErrorCode =
  | 'REQUOTE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'TEMPORARY_REJECTION'

const RETRYABLE_PATTERNS: readonly string[] = [
  'requote',
  'timeout',
  'network',
  'temporary',
  'connection',
  'timed out',
  'server error',
]

function isRetryable(rejection: string | null): boolean {
  if (!rejection) return false
  const lower = rejection.toLowerCase()
  return RETRYABLE_PATTERNS.some((pattern) => lower.includes(pattern))
}

export class SmartOrderRetry {
  private static readonly MAX_ATTEMPTS = 3
  private static readonly DELAY_MS = [500, 1000, 2000] as const

  /**
   * Attempts to execute an order, retrying transient broker errors up to 3 times.
   * Never modifies lot_size, stop_loss, or take_profit across retries.
   */
  static async execute(
    adapter: BrokerAdapter,
    order: OrderPayload
  ): Promise<ExecutionReceipt & { attempts: number; errorCodes: RetryableErrorCode[] }> {
    const errorCodes: RetryableErrorCode[] = []

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      const receipt = await adapter.executeOrder(order)

      if (receipt.success) {
        return { ...receipt, attempts: attempt, errorCodes }
      }

      const rejection = receipt.rejectionReason ?? ''
      
      if (!isRetryable(rejection)) {
        // Non-retryable error — return immediately
        return { ...receipt, attempts: attempt, errorCodes }
      }

      // Log the retry reason
      const code = classifyError(rejection)
      errorCodes.push(code)

      if (attempt < this.MAX_ATTEMPTS) {
        await delay(this.DELAY_MS[attempt - 1] ?? 2000)
      }
    }

    return {
      success: false,
      ticket: null,
      executedPrice: null,
      rejectionReason: `All ${this.MAX_ATTEMPTS} retry attempts exhausted. Last errors: ${errorCodes.join(', ')}`,
      latencyMs: 0,
      attempts: this.MAX_ATTEMPTS,
      errorCodes,
    }
  }
}

function classifyError(rejection: string): RetryableErrorCode {
  const lower = rejection.toLowerCase()
  if (lower.includes('requote')) return 'REQUOTE'
  if (lower.includes('timeout') || lower.includes('timed out')) return 'TIMEOUT'
  if (lower.includes('network') || lower.includes('connection')) return 'NETWORK_ERROR'
  return 'TEMPORARY_REJECTION'
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
