/**
 * Phase 12 Production & Live Trading — Unit Tests
 * Tests: SmartOrderRetry, EmergencyCircuitBreaker, TradeQueueEngine
 */

// ── SmartOrderRetry Tests ─────────────────────────────────────────────────────

import { SmartOrderRetry } from '../broker/SmartOrderRetry'
import { BrokerAdapter } from '../broker/BrokerAdapter'
import { AccountSummary, BrokerPosition } from '@/types/database'

const ORDER = {
  pair: 'EURUSD',
  direction: 'buy' as const,
  lot_size: 0.1,
  requested_price: 1.08500,
  stop_loss: 1.08200,
  take_profit: 1.08900,
}

function makeMockAdapter(responses: Array<{ success: boolean; rejection?: string }>): BrokerAdapter {
  let callIndex = 0
  return {
    connect: async () => true,
    disconnect: async () => {},
    getAccountSummary: async (): Promise<AccountSummary> => ({
      balance: 100000,
      equity: 100000,
      marginUsed: 0,
      freeMargin: 100000,
    }),
    executeOrder: async () => {
      const resp = responses[callIndex] ?? { success: false, rejection: 'Exhausted' }
      callIndex++
      return {
        success: resp.success,
        ticket: resp.success ? 'TKT-001' : null,
        executedPrice: resp.success ? ORDER.requested_price : null,
        rejectionReason: resp.rejection ?? null,
        latencyMs: 5,
      }
    },
    closePosition: async () => true,
    modifyPosition: async () => true,
    getOpenPositions: async (): Promise<Omit<BrokerPosition, 'id' | 'user_id' | 'broker_account_id'>[]> => [],
  }
}

describe('SmartOrderRetry', () => {
  it('returns success on first attempt', async () => {
    const adapter = makeMockAdapter([{ success: true }])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    expect(result.success).toBe(true)
    expect(result.attempts).toBe(1)
    expect(result.errorCodes).toHaveLength(0)
  })

  it('retries on timeout and succeeds', async () => {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Connection Timeout' },
      { success: false, rejection: 'Network Error' },
      { success: true },
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    expect(result.success).toBe(true)
    expect(result.attempts).toBe(3)
    expect(result.errorCodes).toContain('TIMEOUT')
  })

  it('does NOT retry on non-retryable rejection', async () => {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Insufficient funds' },
      { success: true }, // should never be called
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    expect(result.success).toBe(false)
    expect(result.attempts).toBe(1)
  })

  it('fails after max retries exhausted', async () => {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Requote' },
      { success: false, rejection: 'Requote' },
      { success: false, rejection: 'Requote' },
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    expect(result.success).toBe(false)
    expect(result.attempts).toBe(3)
    expect(result.errorCodes.every((c) => c === 'REQUOTE')).toBe(true)
  })

  it('never changes lot_size or SL/TP between retries', async () => {
    const capturedOrders: typeof ORDER[] = []
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Timeout' },
      { success: true },
    ])
    // Capture adapter calls via spy
    const originalExecute = adapter.executeOrder.bind(adapter)
    adapter.executeOrder = async (o) => {
      capturedOrders.push({ ...o })
      return originalExecute(o)
    }
    await SmartOrderRetry.execute(adapter, ORDER)
    capturedOrders.forEach((o) => {
      expect(o.lot_size).toBe(ORDER.lot_size)
      expect(o.stop_loss).toBe(ORDER.stop_loss)
      expect(o.take_profit).toBe(ORDER.take_profit)
    })
  })
})

// ── EmergencyCircuitBreaker Tests ─────────────────────────────────────────────

import { EmergencyCircuitBreaker } from '../broker/EmergencyCircuitBreaker'

// Simple mock supabase for circuit breaker tests
const mockSupabase = {
  from: () => ({
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
  }),
} as unknown as Parameters<typeof EmergencyCircuitBreaker.recordFailure>[0]

describe('EmergencyCircuitBreaker', () => {
  const userId = 'test-user-circuit'
  const accountId = 'test-account-circuit'

  beforeEach(() => {
    EmergencyCircuitBreaker.recordSuccess(userId, accountId)
  })

  it('starts as closed (safe)', () => {
    expect(EmergencyCircuitBreaker.isClosed(userId, accountId)).toBe(true)
  })

  it('records success and stays closed', () => {
    EmergencyCircuitBreaker.recordSuccess(userId, accountId)
    expect(EmergencyCircuitBreaker.isClosed(userId, accountId)).toBe(true)
  })

  it('remains closed below failure threshold', async () => {
    for (let i = 0; i < 4; i++) {
      await EmergencyCircuitBreaker.recordFailure(mockSupabase, userId, accountId, 'test error')
    }
    expect(EmergencyCircuitBreaker.isClosed(userId, accountId)).toBe(true)
  })

  it('trips open at threshold (5 failures)', async () => {
    for (let i = 0; i < 5; i++) {
      await EmergencyCircuitBreaker.recordFailure(mockSupabase, userId, accountId, 'test error')
    }
    expect(EmergencyCircuitBreaker.isClosed(userId, accountId)).toBe(false)
  })

  it('manual reset closes the circuit', async () => {
    for (let i = 0; i < 5; i++) {
      await EmergencyCircuitBreaker.recordFailure(mockSupabase, userId, accountId, 'test error')
    }
    await EmergencyCircuitBreaker.manualReset(mockSupabase, userId, accountId)
    expect(EmergencyCircuitBreaker.isClosed(userId, accountId)).toBe(true)
  })

  it('getState returns full metrics', async () => {
    const state = EmergencyCircuitBreaker.getState(userId, accountId)
    expect(state).toHaveProperty('state')
    expect(state).toHaveProperty('isSafe')
    expect(state).toHaveProperty('consecutiveFailures')
  })
})
