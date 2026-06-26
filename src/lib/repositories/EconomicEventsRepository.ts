import { SupabaseClient } from '@supabase/supabase-js'
import { Database, EconomicEvent } from '@/types/database'

export class EconomicEventsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<EconomicEvent | null> {
    const { data, error } = await this.supabase
      .from('economic_events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(): Promise<EconomicEvent[]> {
    const { data, error } = await this.supabase
      .from('economic_events')
      .select('*')
      .order('event_time', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['economic_events']['Insert']): Promise<EconomicEvent> {
    const { data: created, error } = await this.supabase
      .from('economic_events')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['economic_events']['Update']): Promise<EconomicEvent> {
    const { data: updated, error } = await this.supabase
      .from('economic_events')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('economic_events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<EconomicEvent[]> {
    const { data, error } = await this.supabase
      .from('economic_events')
      .select('*')
      .or(`event_name.ilike.%${query}%,currency.ilike.%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
