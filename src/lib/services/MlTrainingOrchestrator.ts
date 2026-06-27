import {
  MlPrediction,
  IctRule,
  MlMode,
  MlModelRegistry,
  RuleAccuracyWeight,
  PatternStat,
  MlTrainingResult,
} from '@/types/database'
import { FeatureWeightCalibrator } from './FeatureWeightCalibrator'
import { PatternAccuracyTracker } from './PatternAccuracyTracker'

export class MlTrainingOrchestrator {
  /**
   * Orchestrates a full ML training cycle.
   * Reads labeled MlPrediction records, calibrates rule weights, computes pattern stats,
   * and returns a new model payload ready to be persisted by the repository.
   *
   * Does NOT write to the database — that is the repository's responsibility.
   */
  static train(
    predictions: MlPrediction[],
    baseRules: IctRule[],
    currentVersion: string,
    mlMode: MlMode,
    minSamples: number = 5
  ): {
    payload: Omit<MlModelRegistry, 'id' | 'user_id' | 'created_at' | 'trained_at'>
    result: MlTrainingResult
  } {
    const startMs = Date.now()

    const resolved = predictions.filter(p => p.is_correct !== null)
    const correct = resolved.filter(p => p.is_correct === true).length
    const accuracyRate =
      resolved.length > 0
        ? Number(((correct / resolved.length) * 100).toFixed(2))
        : 0

    const avgConfidence =
      resolved.length > 0
        ? Number(
            (resolved.reduce((sum, p) => sum + p.ml_confidence, 0) / resolved.length).toFixed(2)
          )
        : 0

    // Calibrate per-rule weights
    const ruleWeights: RuleAccuracyWeight[] = FeatureWeightCalibrator.calibrate(
      predictions,
      baseRules,
      minSamples
    )

    // Compute pattern statistics
    const patternStats: PatternStat[] = PatternAccuracyTracker.compute(predictions)

    const nextVersion = MlTrainingOrchestrator.nextVersion(currentVersion)
    const durationMs = Date.now() - startMs

    const payload: Omit<MlModelRegistry, 'id' | 'user_id' | 'created_at' | 'trained_at'> = {
      model_version: nextVersion,
      ml_mode: mlMode,
      rule_weights: FeatureWeightCalibrator.serialize(ruleWeights),
      pattern_stats: PatternAccuracyTracker.serialize(patternStats),
      training_samples: resolved.length,
      accuracy_rate: accuracyRate,
      avg_confidence: avgConfidence,
      is_active: true,
    }

    const trainingResult: MlTrainingResult = {
      modelVersion: nextVersion,
      trainingSamples: resolved.length,
      accuracyRate,
      ruleWeights,
      patternStats,
      durationMs,
    }

    return { payload, result: trainingResult }
  }

  /**
   * Increments the numeric suffix in a version string.
   * "ICT-ML-v1" → "ICT-ML-v2"
   * "ICT-ML-v9" → "ICT-ML-v10"
   */
  static nextVersion(current: string): string {
    const match = current.match(/^(.*?)(\d+)$/)
    if (!match) return `${current}-2`
    const prefix = match[1]
    const num = parseInt(match[2], 10)
    return `${prefix}${num + 1}`
  }
}
