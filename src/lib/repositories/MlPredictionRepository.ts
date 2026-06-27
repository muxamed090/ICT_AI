import { SupabaseClient } from '@supabase/supabase-js'
import { Database, MlPrediction } from '@/types/database'

export class MlPredictionRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(
    data: Database['public']['Tables']['ml_predictions']['Insert']
  ): Promise<MlPrediction> {
    const { data: created, error } = await this.supabase
      .from('ml_predictions')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  /** Returns all predictions for a user, newest first */
  async getByUser(userId: string, limit = 100): Promise<MlPrediction[]> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /** Returns predictions that have a resolved outcome (is_correct IS NOT NULL) */
  async getWithOutcomes(userId: string): Promise<MlPrediction[]> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .not('is_correct', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /** Returns predictions that are still awaiting outcome (is_correct IS NULL) */
  async getPendingOutcomes(userId: string): Promise<MlPrediction[]> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .is('is_correct', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /** Links a trade result back to an ML prediction for continuous learning */
  async linkOutcome(
    id: string,
    actualOutcome: string,
    isCorrect: boolean
  ): Promise<MlPrediction> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .update({
        actual_outcome: actualOutcome,
        is_correct: isCorrect,
        outcome_linked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /** Links an ai_decision_id back to the prediction after saving */
  async linkDecision(id: string, aiDecisionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ml_predictions')
      .update({ ai_decision_id: aiDecisionId })
      .eq('id', id)

    if (error) throw error
  }

  /** Returns predictions filtered by currency pair */
  async getByPair(userId: string, pair: string): Promise<MlPrediction[]> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('pair', pair)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /** Returns aggregate statistics for the user's ML prediction history */
  async getStats(userId: string): Promise<{
    total: number
    withOutcomes: number
    correct: number
    accuracyRate: number
  }> {
    const { data, error } = await this.supabase
      .from('ml_predictions')
      .select('is_correct')
      .eq('user_id', userId)

    if (error) throw error

    const all = data || []
    const withOutcomes = all.filter(r => r.is_correct !== null)
    const correct = withOutcomes.filter(r => r.is_correct === true)
    const accuracyRate =
      withOutcomes.length > 0
        ? Number(((correct.length / withOutcomes.length) * 100).toFixed(2))
        : 0

    return {
      total: all.length,
      withOutcomes: withOutcomes.length,
      correct: correct.length,
      accuracyRate,
    }
  }
}
