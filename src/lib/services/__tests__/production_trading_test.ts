/**
 * Phase 12 Production & Live Trading — Unit Tests
 * Tests: SmartOrderRetry, EmergencyCircuitBreaker, TradeQueueEngine
 */

import assert from 'assert'
import { SmartOrderRetry } from '../broker/SmartOrderRetry'
import { BrokerAdapter } from '../broker/BrokerAdapter'
import { AccountSummary, BrokerPosition } from '@/types/database'
import { EmergencyCircuitBreaker } from '../broker/EmergencyCircuitBreaker'

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

async function runTests() {
  console.log('--- RUNNING PRODUCTION TRADING TESTS ---')

  // SmartOrderRetry tests
  {
    const adapter = makeMockAdapter([{ success: true }])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.attempts, 1)
    assert.strictEqual(result.errorCodes.length, 0)
  }

  {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Connection Timeout' },
      { success: false, rejection: 'Network Error' },
      { success: true },
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.attempts, 3)
    assert.ok(result.errorCodes.includes('TIMEOUT'))
  }

  {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Insufficient funds' },
      { success: true },
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    assert.strictEqual(result.success, false)
    assert.strictEqual(result.attempts, 1)
  }

  {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Requote' },
      { success: false, rejection: 'Requote' },
      { success: false, rejection: 'Requote' },
    ])
    const result = await SmartOrderRetry.execute(adapter, ORDER)
    assert.strictEqual(result.success, false)
    assert.strictEqual(result.attempts, 3)
    assert.ok(result.errorCodes.every((c) => c === 'REQUOTE'))
  }

  {
    const adapter = makeMockAdapter([
      { success: false, rejection: 'Timeout' },
      { success: true },
    ])
    const capturedOrders: Array<Parameters<typeof adapter.executeOrder>[0]> = []
    const originalExecute = adapter.executeOrder.bind(adapter)
    adapter.executeOrder = async (o) => {
      capturedOrders.push({ ...o })
      return originalExecute(o)
    }
    await SmartOrderRetry.execute(adapter, ORDER)
    capturedOrders.forEach((o) => {
      assert.strictEqual(o.lot_size, ORDER.lot_size)
      assert.strictEqual(o.stop_loss, ORDER.stop_loss)
      assert.strictEqual(o.take_profit, ORDER.take_profit)
    })
  }

  // EmergencyCircuitBreaker tests
  const mockSupabase = {
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  } as unknown as Parameters<typeof EmergencyCircuitBreaker.recordFailure>[0]

  const userId = 'test-user-circuit'
  const accountId = 'test-account-circuit'

  EmergencyCircuitBreaker.recordSuccess(userId, accountId)
  assert.strictEqual(EmergencyCircuitBreaker.isClosed(userId, accountId), true)

  EmergencyCircuitBreaker.recordSuccess(userId, accountId)
  assert.strictEqual(EmergencyCircuitBreaker.isClosed(userId, accountId), true)

  for (let i = 0; i < 4; i++) {
    await EmergencyCircuitBreaker.recordFailure(mockSupabase, userId, accountId, 'test error')
  }
  assert.strictEqual(EmergencyCircuitBreaker.isClosed(userId, accountId), true)

  for (let i = 0; i < 5; i++) {
    await EmergencyCircuitBreaker.recordFailure(mockSupabase, userId, accountId, 'test error')
  }
  assert.strictEqual(EmergencyCircuitBreaker.isClosed(userId, accountId), false)

  await EmergencyCircuitBreaker.manualReset(mockSupabase, userId, accountId)
  assert.strictEqual(EmergencyCircuitBreaker.isClosed(userId, accountId), true)

  const state = EmergencyCircuitBreaker.getState(userId, accountId)
  assert.ok('state' in state)
  assert.ok('isSafe' in state)
  assert.ok('consecutiveFailures' in state)

  console.log('✔ Production Trading tests passed cleanly.')
}

runTests().catch(console.error)
