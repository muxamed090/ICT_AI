import {
  TradeJournal,
  AiDecision,
  MlPrediction,
  BacktestConfig,
  DecisionType,
} from '@/types/database'

export interface BacktestTradeInput {
  journalEntry: TradeJournal
  aiDecision: AiDecision | null
  mlPrediction: MlPrediction | null
  ictScore: number | null
  mlScore: number | null
  finalScore: number | null
  aiDecisionType: DecisionType | null
  aiConfidence: number | null
}

export class BacktestDataAdapter {
  /**
   * Merges raw historical TradeJournal entries with matched AiDecision and MlPrediction rows.
   * Filters by date range, pair filter, and session filter as configured in BacktestConfig.
   */
  static adapt(
    trades: TradeJournal[],
    decisions: AiDecision[],
    predictions: MlPrediction[],
    config: BacktestConfig
  ): BacktestTradeInput[] {
    const fromTime = new Date(config.dateFrom).getTime()
    // Set to end of day for dateTo
    const toTime = new Date(`${config.dateTo}T23:59:59.999Z`).getTime()

    // Filter trades by date and filters
    const filteredTrades = trades.filter((trade) => {
      const tradeTime = new Date(trade.created_at).getTime()
      if (tradeTime < fromTime || tradeTime > toTime) return false

      if (config.pairFilter.length > 0 && !config.pairFilter.includes(trade.pair)) {
        return false
      }

      if (config.sessionFilter.length > 0 && !config.sessionFilter.includes(trade.session)) {
        return false
      }

      return true
    })

    const result: BacktestTradeInput[] = []
    const windowMs = 12 * 60 * 60 * 1000 // 12-hour matching window

    for (const trade of filteredTrades) {
      const tradeTime = new Date(trade.created_at).getTime()

      // Find matching decision within window
      const matchedDecision = decisions.find((d) => {
        const dTime = new Date(d.created_at).getTime()
        const snapshot = d.snapshot as Record<string, unknown>
        const pairMatch = snapshot && typeof snapshot.pair === 'string' ? snapshot.pair === trade.pair : true
        return pairMatch && Math.abs(dTime - tradeTime) <= windowMs
      }) || null

      // Find matching prediction
      let matchedPrediction: MlPrediction | null = null
      if (matchedDecision) {
        matchedPrediction = predictions.find((p) => p.ai_decision_id === matchedDecision.id) || null
      }
      if (!matchedPrediction) {
        matchedPrediction = predictions.find((p) => {
          const pTime = new Date(p.created_at).getTime()
          return p.pair === trade.pair && Math.abs(pTime - tradeTime) <= windowMs
        }) || null
      }

      // Extract scores and decision types safely from JSONB
      let ictScore: number | null = null
      let mlScore: number | null = null
      let finalScore: number | null = null
      let aiDecisionType: DecisionType | null = null
      let aiConfidence: number | null = trade.ai_confidence ?? null

      if (matchedDecision && matchedDecision.decision_result) {
        const dr = matchedDecision.decision_result as Record<string, unknown>
        if (typeof dr.confluenceScore === 'number') ictScore = dr.confluenceScore
        if (typeof dr.finalScore === 'number') finalScore = dr.finalScore
        if (typeof dr.confidence === 'number' && aiConfidence === null) aiConfidence = dr.confidence
        if (typeof dr.decision === 'string') aiDecisionType = dr.decision as DecisionType
      }

      if (matchedPrediction) {
        mlScore = Number(matchedPrediction.ml_score)
        if (ictScore === null) ictScore = Number(matchedPrediction.ml_score)
      }

      if (finalScore === null) {
        finalScore = mlScore ?? ictScore ?? 7.0
      }

      result.push({
        journalEntry: trade,
        aiDecision: matchedDecision,
        mlPrediction: matchedPrediction,
        ictScore,
        mlScore,
        finalScore,
        aiDecisionType,
        aiConfidence,
      })
    }

    return result
  }
}
