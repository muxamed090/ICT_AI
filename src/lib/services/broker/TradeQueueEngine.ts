import { SupabaseClient } from '@supabase/supabase-js'
import { TradeQueueItem } from '@/types/database'

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
    const { data, error } = await supabase
      .from('trade_queue')
      .insert({
        ...input,
        status: 'queued',
        retry_count: 0,
        max_retries: this.MAX_RETRIES,
        last_error: null,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to enqueue trade: ${error?.message}`)
    }

    return data as TradeQueueItem
  }

  /**
   * Fetches all pending/queued entries for a specific user in FIFO order.
   */
  static async getPendingQueue(
    supabase: SupabaseClient,
    userId: string
  ): Promise<TradeQueueItem[]> {
    const { data, error } = await supabase
      .from('trade_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'validating'])
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch queue: ${error.message}`)

    return (data || []) as TradeQueueItem[]
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
    const { error } = await supabase
      .from('trade_queue')
      .update({ status, last_error: lastError, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) throw new Error(`Failed to advance queue status: ${error.message}`)
  }

  /**
   * Increments retry count and re-queues the item for re-processing.
   */
  static async incrementRetry(
    supabase: SupabaseClient,
    itemId: string,
    reason: string
  ): Promise<void> {
    const { error } = await supabase.rpc('increment_queue_retry', {
      item_id: itemId,
      error_reason: reason,
    })

    if (error) {
      // Fallback to manual increment if RPC not available
      const { data: item } = await supabase
        .from('trade_queue')
        .select('retry_count')
        .eq('id', itemId)
        .single()

      const newRetryCount = ((item as { retry_count: number } | null)?.retry_count ?? 0) + 1
      const nextStatus =
        newRetryCount >= this.MAX_RETRIES ? 'failed' : 'queued'

      await supabase
        .from('trade_queue')
        .update({
          retry_count: newRetryCount,
          status: nextStatus,
          last_error: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
    }
  }
}
