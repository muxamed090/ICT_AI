import {
  MlFeatureVector,
  MlModelRegistry,
  MlInferenceResult,
  MlRecommendation,
  MarketBias,
  UserSettings,
} from '@/types/database'
import { FeatureWeightCalibrator } from './FeatureWeightCalibrator'
import { PatternAccuracyTracker } from './PatternAccuracyTracker'

export class MlInferenceEngine {
  /**
   * Runs ML inference using calibrated rule weights and pattern accuracy stats.
   * Returns null when the model has insufficient data or mode is rules_only.
   */
  static infer(
    vector: MlFeatureVector,
    model: MlModelRegistry,
    settings: UserSettings
  ): MlInferenceResult | null {
    const trace: string[] = []

    if (settings.ml_mode === 'rules_only') {
      trace.push('[ML Inference] Skipped — ml_mode is rules_only.')
      return null
    }

    if (model.training_samples < settings.ml_min_training_samples) {
      trace.push(
        `[ML Inference] Skipped — insufficient training samples ` +
        `(${model.training_samples} < ${settings.ml_min_training_samples} required).`
      )
      return null
    }

    trace.push(`[ML Inference] Starting — model: ${model.model_version}, mode: ${settings.ml_mode}`)

    // 1. Deserialize calibrated weights
    const calibratedWeights = FeatureWeightCalibrator.deserialize(model.rule_weights)
    trace.push(`[ML] Deserialized ${calibratedWeights.length} calibrated rule weights.`)

    // 2. Compute ML-adjusted confluence score using calibrated weights
    let totalCalibrated = 0
    let triggeredCalibrated = 0

    for (const cw of calibratedWeights) {
      const isActive = this.isRuleActive(cw.ruleKey, vector)
      totalCalibrated += cw.calibratedWeight
      if (isActive) triggeredCalibrated += cw.calibratedWeight
    }

    const rawMlScore =
      totalCalibrated > 0
        ? Number(((triggeredCalibrated / totalCalibrated) * 10).toFixed(2))
        : vector.ict_confluence_score

    trace.push(`[ML] Calibrated score: ${rawMlScore.toFixed(2)} (ICT raw: ${vector.ict_confluence_score.toFixed(2)})`)

    // 3. Apply pattern bias boost
    const patternStats = PatternAccuracyTracker.deserialize(model.pattern_stats)
    const biasScore = PatternAccuracyTracker.getBiasScore(patternStats, vector.pair, vector.session)
    // biasScore 0.0–1.0 → maps to -0.5 .. +0.5 score adjustment
    const patternAdjustment = Number(((biasScore - 0.5) * 1.0).toFixed(2))
    const mlScore = Number(Math.min(10, Math.max(0, rawMlScore + patternAdjustment)).toFixed(2))

    trace.push(
      `[ML] Pattern bias for ${vector.pair}/${vector.session}: ` +
      `${(biasScore * 100).toFixed(0)}% accuracy → adjustment: ${patternAdjustment > 0 ? '+' : ''}${patternAdjustment}`
    )
    trace.push(`[ML] Final ML score: ${mlScore.toFixed(2)}/10.0`)

    // 4. Compute confidence
    const mlConfidence = Number(Math.min(100, mlScore * 10).toFixed(2))

    // 5. Derive ML bias (reuse feature vector directional signals)
    const mlBias: MarketBias = this.deriveBias(vector)

    // 6. Confidence boost delta (how much ML adjusts the ICT score)
    const scoreDelta = mlScore - vector.ict_confluence_score
    const confidenceBoost = Number((scoreDelta * settings.ml_confidence_weight).toFixed(3))
    trace.push(`[ML] Confidence boost: ${confidenceBoost > 0 ? '+' : ''}${confidenceBoost} (weight: ${settings.ml_confidence_weight})`)

    // 7. ML recommendation
    const effectiveScore = vector.ict_confluence_score + confidenceBoost
    const mlRecommendation = this.deriveRecommendation(effectiveScore, mlBias, settings.signal_threshold)
    trace.push(`[ML] ML recommendation: ${mlRecommendation}`)

    return {
      mlScore,
      mlConfidence,
      mlBias,
      mlRecommendation,
      confidenceBoost,
      appliedModelVersion: model.model_version,
      inferenceTrace: trace,
    }
  }

  private static isRuleActive(ruleKey: string, vector: MlFeatureVector): boolean {
    switch (ruleKey) {
      case 'mss_choch':       return vector.bos || vector.choch
      case 'fvg_retest':      return vector.fvg_type !== 'none'
      case 'liquidity_sweep': return vector.liquidity_sweep !== 'none'
      case 'killzone_timing': return vector.killzone !== 'none'
      case 'ote_retracement': return vector.ote
      case 'htf_bias':
        return (
          (vector.htf_bias === 'bullish' && vector.trend === 'bullish') ||
          (vector.htf_bias === 'bearish' && vector.trend === 'bearish')
        )
      case 'risk_constraint': return vector.spread <= 2.5 && vector.volume !== 'low'
      default:                return false
    }
  }

  private static deriveBias(vector: MlFeatureVector): MarketBias {
    let bull = 0
    let bear = 0
    if (vector.htf_bias === 'bullish') bull += 2
    if (vector.htf_bias === 'bearish') bear += 2
    if (vector.trend === 'bullish') bull += 1
    if (vector.trend === 'bearish') bear += 1
    if (vector.liquidity_sweep === 'low') bull += 2
    if (vector.liquidity_sweep === 'high') bear += 2
    if (vector.fvg_type === 'bisi') bull += 1.5
    if (vector.fvg_type === 'sibi') bear += 1.5
    if (bull > bear + 1.0) return 'bullish'
    if (bear > bull + 1.0) return 'bearish'
    return 'neutral'
  }

  private static deriveRecommendation(
    score: number,
    bias: MarketBias,
    threshold: number
  ): MlRecommendation {
    if (score < 4.0)          return 'IGNORE'
    if (score < threshold)    return bias !== 'neutral' ? 'WATCH' : 'WAIT'
    return bias !== 'neutral' ? 'ENTRY' : 'WATCH'
  }
}
