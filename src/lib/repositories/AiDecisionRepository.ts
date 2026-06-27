import { SupabaseClient } from '@supabase/supabase-js'
import { Database, AiDecision } from '@/types/database'

export class AiDecisionRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByUser(userId: string): Promise<AiDecision[]> {
    const { data, error } = await this.supabase
      .from('ai_decisions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async create(data: Database['public']['Tables']['ai_decisions']['Insert']): Promise<AiDecision> {
    const { data: created, error } = await this.supabase
      .from('ai_decisions')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async getById(id: string): Promise<AiDecision | null> {
    const { data, error } = await this.supabase
      .from('ai_decisions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }
}
