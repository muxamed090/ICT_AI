import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Signal } from '@/types/database'

export class SignalRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<Signal | null> {
    const { data, error } = await this.supabase
      .from('signals')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(userId?: string): Promise<Signal[]> {
    let query = this.supabase.from('signals').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['signals']['Insert']): Promise<Signal> {
    const { data: created, error } = await this.supabase
      .from('signals')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['signals']['Update']): Promise<Signal> {
    const { data: updated, error } = await this.supabase
      .from('signals')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('signals')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<Signal[]> {
    const { data, error } = await this.supabase
      .from('signals')
      .select('*')
      .ilike('pair', `%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
