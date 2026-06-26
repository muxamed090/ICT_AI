import { SupabaseClient } from '@supabase/supabase-js'
import { Database, AiAnalysis } from '@/types/database'

export class AiAnalysisRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(id: string): Promise<AiAnalysis | null> {
    const { data, error } = await this.supabase
      .from('ai_analysis')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getAll(userId?: string): Promise<AiAnalysis[]> {
    let query = this.supabase.from('ai_analysis').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['ai_analysis']['Insert']): Promise<AiAnalysis> {
    const { data: created, error } = await this.supabase
      .from('ai_analysis')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return created
  }

  async update(id: string, data: Database['public']['Tables']['ai_analysis']['Update']): Promise<AiAnalysis> {
    const { data: updated, error } = await this.supabase
      .from('ai_analysis')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_analysis')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async search(query: string): Promise<AiAnalysis[]> {
    const { data, error } = await this.supabase
      .from('ai_analysis')
      .select('*')
      .or(`pair.ilike.%${query}%,explanation.ilike.%${query}%`)
    
    if (error) throw error
    return data || []
  }
}
