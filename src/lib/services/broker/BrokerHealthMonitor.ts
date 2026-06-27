import { SupabaseClient } from '@supabase/supabase-js'
import { BrokerHealthMetrics, BrokerLog } from '@/types/database'
import { BrokerAdapter } from './BrokerAdapter'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'

export class BrokerHealthMonitor {
  /**
   * Evaluates active connection speed, response latency, and logs for a specific account.
   */
  static async checkHealth(
    supabase: SupabaseClient,
    userId: string,
    accountId: string,
    adapter: BrokerAdapter
  ): Promise<BrokerHealthMetrics> {
    const startTime = Date.now()
    let pingMs = 0
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    let connectionQuality = 100

    try {
      await adapter.getAccountSummary()
      pingMs = Date.now() - startTime
    } catch {
      pingMs = 9999
      status = 'critical'
      connectionQuality = 0
    }

    // Query last 20 execution logs to calculate rejection rates
    const repo = new LiveTradingRepository(supabase)
    const logs = await repo.getLogsForAccountCategory(accountId, 'execution', 20)

    const brokerLogs = (logs || []) as unknown as BrokerLog[]
    const totalExecutions = brokerLogs.length
    const rejectedExecutions = brokerLogs.filter(
      (l) => l.log_level === 'error' && l.message.toLowerCase().includes('reject')
    ).length

    const rejectionRate =
      totalExecutions > 0 ? Number(((rejectedExecutions / totalExecutions) * 100).toFixed(1)) : 0

    // Adjust health status based on thresholds
    if (status !== 'critical') {
      if (pingMs > 1000 || rejectionRate > 15) {
        status = 'degraded'
        connectionQuality = Math.max(20, 100 - (pingMs / 20) - rejectionRate)
      }
      if (pingMs > 2500 || rejectionRate > 30) {
        status = 'critical'
        connectionQuality = 10
      }
    }

    return {
      status,
      pingMs,
      apiLatencyMs: pingMs,
      connectionQuality: Math.round(connectionQuality),
      rejectionRate,
      spreadSpikeDetected: false,
      lastCheckedAt: new Date().toISOString(),
    }
  }
}
