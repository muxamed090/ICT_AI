import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Watchlist } from '@/types/database'

export class WatchlistRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<Watchlist | null> {
    const { data, error } = await this.supabase
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(userId?: string): Promise<Watchlist[]> {
    let query = this.supabase.from('watchlist').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('priority', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['watchlist']['Insert']): Promise<Watchlist> {
    const { data: created, error } = await this.supabase
      .from('watchlist')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['watchlist']['Update']): Promise<Watchlist> {
    const { data: updated, error } = await this.supabase
      .from('watchlist')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('watchlist')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<Watchlist[]> {
    const { data, error } = await this.supabase
      .from('watchlist')
      .select('*')
      .ilike('pair', `%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
