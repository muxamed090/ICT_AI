import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Notification } from '@/types/database'

export class NotificationRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(userId?: string): Promise<Notification[]> {
    let query = this.supabase.from('notifications').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['notifications']['Insert']): Promise<Notification> {
    const { data: created, error } = await this.supabase
      .from('notifications')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['notifications']['Update']): Promise<Notification> {
    const { data: updated, error } = await this.supabase
      .from('notifications')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .or(`title.ilike.%${query}%,message.ilike.%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
