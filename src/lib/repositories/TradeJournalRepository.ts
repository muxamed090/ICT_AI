import { SupabaseClient } from '@supabase/supabase-js'
import { Database, TradeJournal } from '@/types/database'

export class TradeJournalRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<TradeJournal | null> {
    const { data, error } = await this.supabase
      .from('trade_journal')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(userId?: string): Promise<TradeJournal[]> {
    let query = this.supabase.from('trade_journal').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['trade_journal']['Insert']): Promise<TradeJournal> {
    const { data: created, error } = await this.supabase
      .from('trade_journal')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['trade_journal']['Update']): Promise<TradeJournal> {
    const { data: updated, error } = await this.supabase
      .from('trade_journal')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('trade_journal')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<TradeJournal[]> {
    const { data, error } = await this.supabase
      .from('trade_journal')
      .select('*')
      .or(`pair.ilike.%${query}%,setup_type.ilike.%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
