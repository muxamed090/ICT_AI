import { SupabaseClient } from '@supabase/supabase-js'
import { Database, NotificationLog, NotificationQueueItem } from '@/types/database'

export class TelegramRepository {
  constructor(private supabase: SupabaseClient) {}

  // ── Notification Logs ───────────────────────────────────────

  async createLog(
    data: Database['public']['Tables']['notification_logs']['Insert']
  ): Promise<NotificationLog> {
    const { data: created, error } = await this.supabase
      .from('notification_logs')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async getLogsByUser(userId: string, limit = 50): Promise<NotificationLog[]> {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as NotificationLog[]
  }

  async getLogsByStatus(
    userId: string,
    status: NotificationLog['status'],
    limit = 50
  ): Promise<NotificationLog[]> {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as NotificationLog[]
  }

  async getTodayLogCount(userId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count, error } = await this.supabase
      .from('notification_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())

    if (error) throw error
    return count ?? 0
  }

  async getLastMessageTimestamp(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.created_at ?? null
  }

  // ── Notification Queue ──────────────────────────────────────

  async enqueue(
    data: Database['public']['Tables']['notification_queue']['Insert']
  ): Promise<NotificationQueueItem> {
    const { data: created, error } = await this.supabase
      .from('notification_queue')
      .insert({
        ...data,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
        next_retry_at: new Date().toISOString(),
        last_error: null,
      })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async getPendingQueue(userId: string): Promise<NotificationQueueItem[]> {
    const { data, error } = await this.supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as NotificationQueueItem[]
  }

  async getQueueByStatus(
    userId: string,
    status: NotificationQueueItem['status']
  ): Promise<NotificationQueueItem[]> {
    const { data, error } = await this.supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as NotificationQueueItem[]
  }

  async getPendingCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    return count ?? 0
  }

  async getFailedCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'failed')

    if (error) throw error
    return count ?? 0
  }

  async advanceQueueStatus(
    itemId: string,
    status: NotificationQueueItem['status'],
    lastError: string | null = null
  ): Promise<void> {
    const { error } = await this.supabase
      .from('notification_queue')
      .update({
        status,
        last_error: lastError,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)

    if (error) throw error
  }

  async incrementQueueRetry(
    itemId: string,
    reason: string,
    maxRetries = 3
  ): Promise<void> {
    // Fetch current retry_count
    const { data: item, error: fetchErr } = await this.supabase
      .from('notification_queue')
      .select('retry_count')
      .eq('id', itemId)
      .single()

    if (fetchErr) throw fetchErr

    const newRetryCount = ((item as { retry_count: number } | null)?.retry_count ?? 0) + 1
    const nextStatus = newRetryCount >= maxRetries ? 'failed' : 'pending'
    const nextRetryAt = new Date(Date.now() + newRetryCount * 30_000).toISOString()

    const { error } = await this.supabase
      .from('notification_queue')
      .update({
        retry_count: newRetryCount,
        status: nextStatus,
        last_error: reason,
        next_retry_at: nextRetryAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)

    if (error) throw error
  }

  async deleteQueueItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_queue')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  }
}
