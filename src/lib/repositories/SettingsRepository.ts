import { SupabaseClient } from '@supabase/supabase-js'
import { Database, UserSettings } from '@/types/database'

export class SettingsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<UserSettings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(): Promise<UserSettings[]> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['user_settings']['Insert']): Promise<UserSettings> {
    const { data: created, error } = await this.supabase
      .from('user_settings')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['user_settings']['Update']): Promise<UserSettings> {
    const { data: updated, error } = await this.supabase
      .from('user_settings')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<UserSettings[]> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .or(`language.eq.${query},theme.eq.${query}`)
    
    if (error) throw error
    return data || []
  }
}
