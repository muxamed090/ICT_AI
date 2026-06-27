import {
  MarketSnapshot,
  IctRule,
  UserSettings,
  EconomicEvent,
  DecisionType,
  MlModelRegistry,
  HybridDecisionResult,
} from '@/types/database'
import { IctRulesEngine } from './IctRulesEngine'
import { TradingCostEngine } from './TradingCostEngine'
import { RiskManagementEngine } from './RiskManagementEngine'
import { PositionSizeCalculator } from './PositionSizeCalculator'
import { MlFeatureExtractor } from './MlFeatureExtractor'
import { MlInferenceEngine } from './MlInferenceEngine'

export class AiDecisionEngine {
  /**
   * Evaluates market conditions, calculates trade confluences, lot sizing,
   * expected costs, and validates risk filters.
   *
   * When an active MlModelRegistry is provided and ml_mode !== 'rules_only',
   * the ML Inference Engine adjusts the confluence score and may override
   * the recommendation (ml_priority mode).
   *
   * Returns a HybridDecisionResult which extends DecisionResult — all existing
   * consumers continue to work without modification.
   */
  static evaluate(
    snapshot: MarketSnapshot,
    rules: IctRule[],
    settings: UserSettings,
    events: EconomicEvent[],
    accountBalance: number,
    activeDrawdown: number = 0.0,
    activeModel: MlModelRegistry | null = null
  ): HybridDecisionResult {
    const trace: string[] = []
    const reasons: string[] = []

    trace.push(`[Start] Evaluated snapshot for pair: ${snapshot.pair}`)

    // ── Step 1/5: ICT Rules Engine ──────────────────────────────────────────
    trace.push(`[Step 1/5] Running Rules Engine evaluation...`)
    const rulesResult = IctRulesEngine.evaluate(snapshot, rules, settings.signal_threshold)
    trace.push(`Rules Engine: Confluence ${rulesResult.confluenceScore}/10.0, Bias: ${rulesResult.marketBias}`)

    // ── Step 2/5: Position Sizing ───────────────────────────────────────────
    trace.push(`[Step 2/5] Calculating position sizing metrics...`)
    const isBiasTradable = rulesResult.marketBias !== 'neutral'
    const positionCalculation = isBiasTradable
      ? PositionSizeCalculator.calculate(
          snapshot.pair,
          rulesResult.marketBias as 'bullish' | 'bearish',
          settings.risk_percent,
          settings.risk_profile,
          accountBalance
        )
      : null

    if (positionCalculation) {
      trace.push(`Position: Lots ${positionCalculation.lotSize}, Risk $${positionCalculation.riskAmountUsd}`)
    } else {
      trace.push(`Position sizing skipped — bias is neutral.`)
    }

    // ── Step 3/5: Trading Costs ─────────────────────────────────────────────
    trace.push(`[Step 3/5] Estimating broker execution costs...`)
    const lotSizeForCosts = positionCalculation?.lotSize ?? 0.1
    const tradingCost = TradingCostEngine.calculateExpectedExecutionCost(
      snapshot.pair,
      snapshot.spread,
      lotSizeForCosts
    )
    trace.push(`Trading Costs: $${tradingCost.totalCost} (Spread: $${tradingCost.spreadCost}, Comm: $${tradingCost.commission})`)

    // ── Step 4/5: Risk Validation ───────────────────────────────────────────
    trace.push(`[Step 4/5] Evaluating risk boundary filters...`)
    const currentTime = new Date().toISOString()
    const riskEvaluation = RiskManagementEngine.evaluateRisk(
      snapshot.spread,
      settings.max_spread_allowed,
      currentTime,
      events,
      settings.news_buffer_minutes,
      activeDrawdown,
      settings.daily_drawdown_limit
    )

    if (riskEvaluation.isSpreadOk) {
      trace.push(`Spread Filter: PASSED (${snapshot.spread} pips <= ${settings.max_spread_allowed} pips)`)
    } else {
      trace.push(`Spread Filter: FAILED (${snapshot.spread} pips > ${settings.max_spread_allowed} pips)`)
      reasons.push(`Spread is too wide (${snapshot.spread} pips)`)
    }
    if (riskEvaluation.isNewsSafe) {
      trace.push(`News Buffer Filter: PASSED`)
    } else {
      trace.push(`News Buffer Filter: FAILED (event: ${riskEvaluation.collidingNewsEvent})`)
      reasons.push(`High-impact news event collision: ${riskEvaluation.collidingNewsEvent}`)
    }
    if (riskEvaluation.isDrawdownOk) {
      trace.push(`Drawdown Filter: PASSED (${activeDrawdown}% <= ${settings.daily_drawdown_limit}%)`)
    } else {
      trace.push(`Drawdown Filter: FAILED (${activeDrawdown}% > ${settings.daily_drawdown_limit}%)`)
      reasons.push(`Daily drawdown limit exceeded (${activeDrawdown}%)`)
    }

    // ── Step 5/5: ML Inference ──────────────────────────────────────────────
    trace.push(`[Step 5/5] Running ML Inference Engine...`)
    let mlInference = null
    let finalScore = rulesResult.confluenceScore

    if (activeModel && settings.ml_mode !== 'rules_only') {
      const featureVector = MlFeatureExtractor.extract(snapshot, rulesResult)
      mlInference = MlInferenceEngine.infer(featureVector, activeModel, settings)

      if (mlInference) {
        finalScore = Number(
          Math.min(10, Math.max(0, rulesResult.confluenceScore + mlInference.confidenceBoost)).toFixed(2)
        )
        for (const t of mlInference.inferenceTrace) {
          trace.push(t)
        }
        trace.push(`[ML] Final combined score: ${finalScore.toFixed(2)} (ICT: ${rulesResult.confluenceScore} + ML Boost: ${mlInference.confidenceBoost})`)
      } else {
        trace.push(`[ML] Inference skipped (insufficient samples or rules_only mode).`)
      }
    } else {
      trace.push(`[ML] Skipped — ml_mode is rules_only or no active model found.`)
    }

    // ── Decision Coordination ───────────────────────────────────────────────
    const isRiskSafe =
      riskEvaluation.isSpreadOk && riskEvaluation.isNewsSafe && riskEvaluation.isDrawdownOk
    let decision: DecisionType = 'IGNORE'

    // In ml_priority mode with high-confidence ML, use ML recommendation
    if (
      settings.ml_mode === 'ml_priority' &&
      mlInference !== null &&
      mlInference.mlConfidence >= settings.signal_threshold * 10 &&
      isRiskSafe
    ) {
      decision = mlInference.mlRecommendation as DecisionType
      reasons.push(`ML Priority mode — high ML confidence (${mlInference.mlConfidence.toFixed(0)}%) overrides ICT rules.`)
      trace.push(`[Decision] ML Priority override applied: ${decision}`)
    } else {
      // Standard decision using finalScore (which includes ML boost in hybrid mode)
      if (finalScore < 4.0) {
        decision = 'IGNORE'
        reasons.push('Confluence score is below baseline trade criteria.')
      } else if (finalScore < settings.signal_threshold) {
        if (isRiskSafe && isBiasTradable) {
          decision = 'WATCH'
          reasons.push('Confluence is moderate. Monitor structure for additional confirmations.')
        } else {
          decision = 'WAIT'
          reasons.push('Confluence is moderate, and execution is blocked by risk parameters.')
        }
      } else {
        if (isRiskSafe && isBiasTradable) {
          decision = 'ENTRY'
          reasons.push('Strong confluence and all risk validation rules passed.')
        } else {
          decision = 'WAIT'
          if (!isBiasTradable) {
            reasons.push('Confluence is high but directional bias remains neutral.')
          } else {
            reasons.push('Strong confluence, but execution is locked by risk boundary failures.')
          }
        }
      }
    }

    trace.push(`[Done] Confluence decision resolved to: ${decision}`)

    return {
      decision,
      confluenceScore: rulesResult.confluenceScore,
      confidence: rulesResult.confidence,
      marketBias: rulesResult.marketBias,
      riskEvaluation,
      positionCalculation,
      tradingCost,
      reasons,
      decisionTrace: trace,
      // ML extensions
      mlInference,
      finalScore,
      mlModelVersion: mlInference?.appliedModelVersion ?? 'ICT-AI-v1',
    }
  }
}
