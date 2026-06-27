import { SupabaseClient } from '@supabase/supabase-js'

export class AuditLogger {
  /**
   * Writes a structured log entry directly to the database.
   */
  static async log(
    supabase: SupabaseClient,
    userId: string,
    category: 'execution' | 'risk' | 'connection' | 'system',
    logLevel: 'info' | 'warn' | 'error' | 'security' | 'circuit_breaker',
    message: string,
    metadata: Record<string, unknown> = {},
    accountId: string | null = null
  ): Promise<void> {
    try {
      // Print to stdout for Docker/PM2 container log collection
      const logStr = `[${logLevel.toUpperCase()}] [${category.toUpperCase()}] ${message}`
      if (logLevel === 'error' || logLevel === 'circuit_breaker') {
        console.error(logStr, JSON.stringify(metadata))
      } else {
        console.log(logStr, JSON.stringify(metadata))
      }

      await supabase.from('broker_logs').insert({
        user_id: userId,
        broker_account_id: accountId,
        log_level: logLevel,
        category,
        message,
        metadata,
      })
    } catch (err) {
      console.error(`Audit log insertion error: ${(err as Error).message}`)
    }
  }
}
