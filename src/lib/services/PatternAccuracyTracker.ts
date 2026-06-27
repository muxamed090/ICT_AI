import { MlPrediction, PatternStat } from '@/types/database'

export class PatternAccuracyTracker {
  /**
   * Computes per-pair / per-session accuracy statistics
   * from all ML predictions that have a resolved outcome.
   */
  static compute(predictions: MlPrediction[]): PatternStat[] {
    const resolved = predictions.filter(p => p.is_correct !== null)

    // Group by pair + session
    const groups = new Map<string, MlPrediction[]>()
    for (const p of resolved) {
      const key = `${p.pair}::${p.session}`
      const existing = groups.get(key) ?? []
      existing.push(p)
      groups.set(key, existing)
    }

    const stats: PatternStat[] = []
    for (const [key, group] of groups.entries()) {
      const [pair, session] = key.split('::')
      const total = group.length
      const correct = group.filter(p => p.is_correct === true).length
      const avgMlScore =
        total > 0
          ? Number((group.reduce((sum, p) => sum + p.ml_score, 0) / total).toFixed(2))
          : 0

      stats.push({
        pair,
        session,
        totalPredictions: total,
        correctPredictions: correct,
        accuracyRate: total > 0 ? Number((correct / total).toFixed(4)) : 0,
        avgMlScore,
      })
    }

    return stats
  }

  /**
   * Returns a 0.0–1.0 historical accuracy bias score for a specific pair + session.
   * Returns 0.5 (neutral) when no data exists for the combination.
   */
  static getBiasScore(stats: PatternStat[], pair: string, session: string): number {
    const match = stats.find(s => s.pair === pair && s.session === session)
    if (!match || match.totalPredictions === 0) return 0.5
    return match.accuracyRate
  }

  /** Serialize PatternStat[] to a plain Record for JSONB storage */
  static serialize(stats: PatternStat[]): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const s of stats) {
      out[`${s.pair}::${s.session}`] = {
        pair: s.pair,
        session: s.session,
        totalPredictions: s.totalPredictions,
        correctPredictions: s.correctPredictions,
        accuracyRate: s.accuracyRate,
        avgMlScore: s.avgMlScore,
      }
    }
    return out
  }

  /** Restore PatternStat[] from stored JSONB */
  static deserialize(raw: Record<string, unknown>): PatternStat[] {
    const results: PatternStat[] = []
    for (const val of Object.values(raw)) {
      if (val !== null && typeof val === 'object') {
        const entry = val as Record<string, unknown>
        results.push({
          pair: typeof entry.pair === 'string' ? entry.pair : '',
          session: typeof entry.session === 'string' ? entry.session : '',
          totalPredictions: typeof entry.totalPredictions === 'number' ? entry.totalPredictions : 0,
          correctPredictions: typeof entry.correctPredictions === 'number' ? entry.correctPredictions : 0,
          accuracyRate: typeof entry.accuracyRate === 'number' ? entry.accuracyRate : 0,
          avgMlScore: typeof entry.avgMlScore === 'number' ? entry.avgMlScore : 0,
        })
      }
    }
    return results
  }
}
