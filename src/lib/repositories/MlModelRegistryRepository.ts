import { SupabaseClient } from '@supabase/supabase-js'
import { Database, MlModelRegistry } from '@/types/database'

export class MlModelRegistryRepository {
  constructor(private supabase: SupabaseClient) {}

  /** Returns the single active model for the user, or null */
  async getActiveModel(userId: string): Promise<MlModelRegistry | null> {
    const { data, error } = await this.supabase
      .from('ml_model_registry')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Deactivates all previous models for the user,
   * then inserts the new model as the active version.
   */
  async rotateModel(
    userId: string,
    data: Database['public']['Tables']['ml_model_registry']['Insert']
  ): Promise<MlModelRegistry> {
    // Deactivate all existing models
    const { error: deactivateError } = await this.supabase
      .from('ml_model_registry')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) throw deactivateError

    // Insert the new active model
    const { data: created, error: insertError } = await this.supabase
      .from('ml_model_registry')
      .insert({ ...data, user_id: userId, is_active: true })
      .select()
      .single()

    if (insertError) throw insertError
    return created
  }

  /** Returns all model versions (history) for the user, newest first */
  async getHistory(userId: string): Promise<MlModelRegistry[]> {
    const { data, error } = await this.supabase
      .from('ml_model_registry')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /** Returns a specific model by version string */
  async getByVersion(userId: string, version: string): Promise<MlModelRegistry | null> {
    const { data, error } = await this.supabase
      .from('ml_model_registry')
      .select('*')
      .eq('user_id', userId)
      .eq('model_version', version)
      .maybeSingle()

    if (error) throw error
    return data
  }
}
