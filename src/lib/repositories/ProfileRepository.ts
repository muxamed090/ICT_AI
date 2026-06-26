import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Profile } from '@/types/database'

export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['profiles']['Insert']): Promise<Profile> {
    const { data: created, error } = await this.supabase
      .from('profiles')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['profiles']['Update']): Promise<Profile> {
    const { data: updated, error } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
