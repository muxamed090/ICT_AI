import { MarketSnapshot, EngineResult, MlFeatureVector } from '@/types/database'

export class MlFeatureExtractor {
  /**
   * Transforms a MarketSnapshot and EngineResult into a normalized MlFeatureVector.
   * This is the canonical input representation used by all ML services.
   */
  static extract(
    snapshot: MarketSnapshot,
    engineResult: EngineResult
  ): MlFeatureVector {
    const triggeredCount = engineResult.triggeredRules.filter(r => r.isTriggered).length
    const totalCount = engineResult.triggeredRules.length

    return {
      pair: snapshot.pair,
      timeframe: snapshot.timeframe,
      session: snapshot.session,
      killzone: snapshot.killzone,
      htf_bias: snapshot.htf_bias,
      trend: snapshot.trend,
      bos: snapshot.bos,
      choch: snapshot.choch,
      fvg_type: snapshot.fvg_type,
      ote: snapshot.ote,
      liquidity_sweep: snapshot.liquidity_sweep,
      volume: snapshot.volume,
      spread: snapshot.spread,
      ict_confluence_score: engineResult.confluenceScore,
      ict_confidence: engineResult.confidence,
      triggered_rule_count: triggeredCount,
      total_rule_count: totalCount,
    }
  }

  /**
   * Serializes a MlFeatureVector to a plain Record for JSONB storage.
   */
  static serialize(vector: MlFeatureVector): Record<string, unknown> {
    return vector as unknown as Record<string, unknown>
  }

  /**
   * Deserializes from JSONB storage back to MlFeatureVector.
   * Returns null if the stored data is structurally invalid.
   */
  static deserialize(raw: Record<string, unknown>): MlFeatureVector | null {
    if (
      typeof raw.pair !== 'string' ||
      typeof raw.ict_confluence_score !== 'number'
    ) {
      return null
    }

    return {
      pair: raw.pair as string,
      timeframe: typeof raw.timeframe === 'string' ? raw.timeframe : '15m',
      session: raw.session as MlFeatureVector['session'],
      killzone: raw.killzone as MlFeatureVector['killzone'],
      htf_bias: raw.htf_bias as MlFeatureVector['htf_bias'],
      trend: raw.trend as MlFeatureVector['trend'],
      bos: raw.bos === true,
      choch: raw.choch === true,
      fvg_type: raw.fvg_type as MlFeatureVector['fvg_type'],
      ote: raw.ote === true,
      liquidity_sweep: raw.liquidity_sweep as MlFeatureVector['liquidity_sweep'],
      volume: raw.volume as MlFeatureVector['volume'],
      spread: typeof raw.spread === 'number' ? raw.spread : 0,
      ict_confluence_score: raw.ict_confluence_score as number,
      ict_confidence: typeof raw.ict_confidence === 'number' ? raw.ict_confidence : 0,
      triggered_rule_count: typeof raw.triggered_rule_count === 'number' ? raw.triggered_rule_count : 0,
      total_rule_count: typeof raw.total_rule_count === 'number' ? raw.total_rule_count : 0,
    }
  }
}
