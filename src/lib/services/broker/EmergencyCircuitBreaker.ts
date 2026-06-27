import { SupabaseClient } from '@supabase/supabase-js'
import { AuditLogger } from './AuditLogger'

type CircuitState = 'closed' | 'open' | 'half_open'

interface CircuitMetrics {
  consecutiveFailures: number
  lastFailureAt: string | null
  trippedAt: string | null
  state: CircuitState
}

// In-memory circuit state per user+account (per process)
const circuitMap = new Map<string, CircuitMetrics>()

const FAILURE_THRESHOLD = 5       // Trip after 5 consecutive failures
const RECOVERY_WINDOW_MS = 60000  // 60 seconds before trying half-open

function getCircuitKey(userId: string, accountId: string): string {
  return `${userId}:${accountId}`
}

export class EmergencyCircuitBreaker {
  /**
   * Checks whether trading should proceed for this user+account.
   * Returns true if safe, false if circuit is open (tripped).
   */
  static isClosed(userId: string, accountId: string): boolean {
    const key = getCircuitKey(userId, accountId)
    const metrics = circuitMap.get(key)

    if (!metrics) return true // No state → circuit closed (safe)

    if (metrics.state === 'closed') return true

    if (metrics.state === 'open') {
      const now = Date.now()
      const trippedAt = metrics.trippedAt ? new Date(metrics.trippedAt).getTime() : 0
      if (now - trippedAt > RECOVERY_WINDOW_MS) {
        // Move to half-open to allow one test order
        metrics.state = 'half_open'
        circuitMap.set(key, metrics)
        return true
      }
      return false // Fully tripped
    }

    // half_open — allow exactly one attempt
    return true
  }

  /**
   * Records a successful execution — resets the circuit.
   */
  static recordSuccess(userId: string, accountId: string): void {
    const key = getCircuitKey(userId, accountId)
    circuitMap.set(key, {
      consecutiveFailures: 0,
      lastFailureAt: null,
      trippedAt: null,
      state: 'closed',
    })
  }

  /**
   * Records a failure. Trips the circuit if threshold exceeded.
   */
  static async recordFailure(
    supabase: SupabaseClient,
    userId: string,
    accountId: string,
    reason: string
  ): Promise<void> {
    const key = getCircuitKey(userId, accountId)
    const existing = circuitMap.get(key) ?? {
      consecutiveFailures: 0,
      lastFailureAt: null,
      trippedAt: null,
      state: 'closed' as CircuitState,
    }

    const consecutiveFailures = existing.consecutiveFailures + 1
    const now = new Date().toISOString()

    if (consecutiveFailures >= FAILURE_THRESHOLD || existing.state === 'half_open') {
      const updated: CircuitMetrics = {
        consecutiveFailures,
        lastFailureAt: now,
        trippedAt: now,
        state: 'open',
      }
      circuitMap.set(key, updated)

      await AuditLogger.log(
        supabase,
        userId,
        'system',
        'circuit_breaker',
        `Circuit breaker TRIPPED for account ${accountId}. Reason: ${reason}`,
        { consecutiveFailures, reason },
        accountId
      )
    } else {
      circuitMap.set(key, {
        consecutiveFailures,
        lastFailureAt: now,
        trippedAt: existing.trippedAt,
        state: 'closed',
      })
    }
  }

  /**
   * Manually resets the circuit (e.g., after user intervention or health recovery).
   */
  static async manualReset(
    supabase: SupabaseClient,
    userId: string,
    accountId: string
  ): Promise<void> {
    const key = getCircuitKey(userId, accountId)
    circuitMap.set(key, {
      consecutiveFailures: 0,
      lastFailureAt: null,
      trippedAt: null,
      state: 'closed',
    })

    await AuditLogger.log(
      supabase,
      userId,
      'system',
      'info',
      `Circuit breaker manually reset for account ${accountId}`,
      {},
      accountId
    )
  }

  /**
   * Returns current circuit state for display (read-only).
   */
  static getState(userId: string, accountId: string): CircuitMetrics & { isSafe: boolean } {
    const key = getCircuitKey(userId, accountId)
    const metrics = circuitMap.get(key) ?? {
      consecutiveFailures: 0,
      lastFailureAt: null,
      trippedAt: null,
      state: 'closed' as CircuitState,
    }
    return { ...metrics, isSafe: this.isClosed(userId, accountId) }
  }
}
