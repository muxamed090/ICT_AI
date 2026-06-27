"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { IctRulesRepository } from '@/lib/repositories/IctRulesRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import { MlModelRegistryRepository } from '@/lib/repositories/MlModelRegistryRepository'
import { MlPredictionRepository } from '@/lib/repositories/MlPredictionRepository'
import { MlTrainingOrchestrator } from '@/lib/services/MlTrainingOrchestrator'
import { mlTrainingInputSchema, mlOutcomeLinkSchema } from '@/lib/validators/validators'
import { ActionResult } from '@/lib/services/types'
import { handleActionError } from '@/lib/services/errorHandler'
import {
  MlTrainingResult,
  MlPrediction,
  MlModelRegistry,
} from '@/types/database'

/**
 * Triggers a training cycle using all ML predictions that have resolved outcomes.
 * Produces a new MlModelRegistry row and deactivates the previous model.
 */
export async function triggerMlTrainingAction(
  input: unknown
): Promise<ActionResult<MlTrainingResult>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized.' } }
    }

    const validated = mlTrainingInputSchema.parse(input)

    // Fetch required data
    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    if (!settings) {
      return { success: false, error: { type: 'database', message: 'User settings not found.' } }
    }

    const rulesRepo = new IctRulesRepository(supabase)
    const baseRules = await rulesRepo.getByUser(user.id)

    const predictionRepo = new MlPredictionRepository(supabase)
    const predictions = await predictionRepo.getWithOutcomes(user.id)

    if (predictions.length < validated.minSamples) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: `Insufficient training data: ${predictions.length} samples available, ${validated.minSamples} required.`,
        },
      }
    }

    // Get current model version to calculate next version
    const modelRepo = new MlModelRegistryRepository(supabase)
    const currentModel = await modelRepo.getActiveModel(user.id)
    const currentVersion = currentModel?.model_version ?? 'ICT-ML-v0'

    // Run training orchestration (pure business logic, no side effects)
    const { payload, result } = MlTrainingOrchestrator.train(
      predictions,
      baseRules,
      currentVersion,
      validated.mlMode,
      validated.minSamples
    )

    // Persist the new model (rotate: deactivate old, insert new)
    await modelRepo.rotateModel(user.id, { ...payload, user_id: user.id })

    revalidatePath('/dashboard/ml-engine')

    return { success: true, data: result }
  } catch (err) {
    return handleActionError<MlTrainingResult>(err)
  }
}

/**
 * Links a resolved trade outcome back to an ML prediction record.
 * Called when a TradeJournal entry is updated with a final result.
 */
export async function linkMlOutcomeAction(
  input: unknown
): Promise<ActionResult<MlPrediction>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized.' } }
    }

    const validated = mlOutcomeLinkSchema.parse(input)

    const predictionRepo = new MlPredictionRepository(supabase)
    const updated = await predictionRepo.linkOutcome(
      validated.mlPredictionId,
      validated.actualOutcome,
      validated.isCorrect
    )

    revalidatePath('/dashboard/ml-engine')

    return { success: true, data: updated }
  } catch (err) {
    return handleActionError<MlPrediction>(err)
  }
}

/**
 * Fetches the active ML model details, prediction stats, and training eligibility.
 */
export async function getMlModelStatusAction(): Promise<
  ActionResult<{
    activeModel: MlModelRegistry | null
    stats: { total: number; withOutcomes: number; correct: number; accuracyRate: number }
    canTrain: boolean
  }>
> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized.' } }
    }

    const settingsRepo = new SettingsRepository(supabase)
    const settings = await settingsRepo.getById(user.id)
    const minSamples = settings?.ml_min_training_samples ?? 10

    const modelRepo = new MlModelRegistryRepository(supabase)
    const activeModel = await modelRepo.getActiveModel(user.id)

    const predictionRepo = new MlPredictionRepository(supabase)
    const stats = await predictionRepo.getStats(user.id)

    const canTrain = stats.withOutcomes >= minSamples

    return {
      success: true,
      data: { activeModel, stats, canTrain },
    }
  } catch (err) {
    return handleActionError<{
      activeModel: MlModelRegistry | null
      stats: { total: number; withOutcomes: number; correct: number; accuracyRate: number }
      canTrain: boolean
    }>(err)
  }
}

/**
 * Fetches the full ML prediction history for the current user.
 */
export async function getMlPredictionHistoryAction(
  limit = 50
): Promise<ActionResult<MlPrediction[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized.' } }
    }

    const predictionRepo = new MlPredictionRepository(supabase)
    const predictions = await predictionRepo.getByUser(user.id, limit)

    return { success: true, data: predictions }
  } catch (err) {
    return handleActionError<MlPrediction[]>(err)
  }
}
