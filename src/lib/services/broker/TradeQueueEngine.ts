import { SupabaseClient } from '@supabase/supabase-js'
import { TradeQueueItem } from '@/types/database'
import { LiveTradingRepository } from '@/lib/repositories/LiveTradingRepository'

type EnqueueInput = Omit<
  TradeQueueItem,
  'id' | 'status' | 'retry_count' | 'max_retries' | 'last_error' | 'created_at' | 'updated_at'
>

export class TradeQueueEngine {
  private static readonly MAX_RETRIES = 3

  /**
   * Adds a new trade signal to the execution queue with initial status 'queued'.
   */
  static async enqueue(
    supabase: SupabaseClient,
    input: EnqueueInput
  ): Promise<TradeQueueItem> {
    const repo = new LiveTradingRepository(supabase)
    return repo.enqueueTrade(input, this.MAX_RETRIES)
  }

  /**
   * Fetches all pending/queued entries for a specific user in FIFO order.
   */
  static async getPendingQueue(
    supabase: SupabaseClient,
    userId: string
  ): Promise<TradeQueueItem[]> {
    const repo = new LiveTradingRepository(supabase)
    return repo.getPendingQueue(userId)
  }

  /**
   * Advances a queue entry's status.
   */
  static async advanceStatus(
    supabase: SupabaseClient,
    itemId: string,
    status: TradeQueueItem['status'],
    lastError: string | null = null
  ): Promise<void> {
    const repo = new LiveTradingRepository(supabase)
    await repo.advanceQueueStatus(itemId, status, lastError)
  }

  /**
   * Increments retry count and re-queues the item for re-processing.
   */
  static async incrementRetry(
    supabase: SupabaseClient,
    itemId: string,
    reason: string
  ): Promise<void> {
    const repo = new LiveTradingRepository(supabase)
    await repo.incrementQueueRetry(itemId, reason, this.MAX_RETRIES)
  }
}
