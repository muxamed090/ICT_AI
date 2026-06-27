import { IctRule, MlPrediction, RuleAccuracyWeight } from '@/types/database'

export class FeatureWeightCalibrator {
  /**
   * Computes accuracy-adjusted weights for every ICT rule key.
   * Uses only predictions that have a resolved outcome (is_correct !== null).
   *
   * Algorithm:
   *   For each rule_key, count predictions where that rule feature was active.
   *   Of those, count how many had is_correct === true.
   *   accuracyRate = correctSamples / totalSamples
   *   calibratedWeight = baseWeight * (0.5 + accuracyRate * 0.5)
   *   → Weights never drop below 50% of base; high-accuracy rules get boosted.
   *   Rules with too few samples keep their base weight unchanged.
   */
  static calibrate(
    predictions: MlPrediction[],
    baseRules: IctRule[],
    minSamples: number = 5
  ): RuleAccuracyWeight[] {
    // Only use predictions with known outcomes
    const resolved = predictions.filter(p => p.is_correct !== null)

    const results: RuleAccuracyWeight[] = []

    for (const rule of baseRules) {
      const key = rule.rule_key
      const baseWeight = Number(rule.weight)

      // Identify predictions where this rule's feature was active
      const relevant = resolved.filter(p => {
        const fv = p.feature_vector
        return this.isRuleActiveInVector(key, fv)
      })

      const totalSamples = relevant.length
      const correctSamples = relevant.filter(p => p.is_correct === true).length

      let calibratedWeight: number
      if (totalSamples < minSamples) {
        // Insufficient data — keep the base weight
        calibratedWeight = baseWeight
      } else {
        const accuracyRate = correctSamples / totalSamples
        calibratedWeight = Number((baseWeight * (0.5 + accuracyRate * 0.5)).toFixed(3))
      }

      results.push({
        ruleKey: key,
        totalSamples,
        correctSamples,
        accuracyRate: totalSamples > 0 ? Number((correctSamples / totalSamples).toFixed(4)) : 0,
        calibratedWeight,
      })
    }

    return results
  }

  /**
   * Determines whether a given rule's condition was active in the feature vector.
   * Maps rule_keys to the feature flags present in MlFeatureVector.
   */
  private static isRuleActiveInVector(
    ruleKey: string,
    fv: Record<string, unknown>
  ): boolean {
    switch (ruleKey) {
      case 'mss_choch':
        return fv.bos === true || fv.choch === true
      case 'fvg_retest':
        return fv.fvg_type !== 'none' && typeof fv.fvg_type === 'string'
      case 'liquidity_sweep':
        return fv.liquidity_sweep === 'high' || fv.liquidity_sweep === 'low'
      case 'killzone_timing':
        return fv.killzone !== 'none' && typeof fv.killzone === 'string'
      case 'ote_retracement':
        return fv.ote === true
      case 'htf_bias': {
        const htf = fv.htf_bias
        const trend = fv.trend
        return (
          (htf === 'bullish' && trend === 'bullish') ||
          (htf === 'bearish' && trend === 'bearish')
        )
      }
      case 'risk_constraint': {
        const spread = typeof fv.spread === 'number' ? fv.spread : 99
        return spread <= 2.5 && fv.volume !== 'low'
      }
      default:
        return false
    }
  }

  /** Serialize RuleAccuracyWeight[] to a plain Record for JSONB storage */
  static serialize(weights: RuleAccuracyWeight[]): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const w of weights) {
      out[w.ruleKey] = {
        totalSamples: w.totalSamples,
        correctSamples: w.correctSamples,
        accuracyRate: w.accuracyRate,
        calibratedWeight: w.calibratedWeight,
      }
    }
    return out
  }

  /** Restore RuleAccuracyWeight[] from stored JSONB */
  static deserialize(raw: Record<string, unknown>): RuleAccuracyWeight[] {
    const results: RuleAccuracyWeight[] = []
    for (const [ruleKey, val] of Object.entries(raw)) {
      if (val !== null && typeof val === 'object') {
        const entry = val as Record<string, unknown>
        results.push({
          ruleKey,
          totalSamples: typeof entry.totalSamples === 'number' ? entry.totalSamples : 0,
          correctSamples: typeof entry.correctSamples === 'number' ? entry.correctSamples : 0,
          accuracyRate: typeof entry.accuracyRate === 'number' ? entry.accuracyRate : 0,
          calibratedWeight: typeof entry.calibratedWeight === 'number' ? entry.calibratedWeight : 1,
        })
      }
    }
    return results
  }
}
