import { 
  MarketSnapshot, 
  IctRule, 
  UserSettings, 
  EconomicEvent, 
  DecisionResult, 
  DecisionType 
} from '@/types/database'
import { IctRulesEngine } from './IctRulesEngine'
import { TradingCostEngine } from './TradingCostEngine'
import { RiskManagementEngine } from './RiskManagementEngine'
import { PositionSizeCalculator } from './PositionSizeCalculator'

export class AiDecisionEngine {
  /**
   * Evaluates market conditions to calculate trade confluences, lot sizing, expected costs, 
   * and validates risk filters, producing a final trade execution recommendation.
   */
  static evaluate(
    snapshot: MarketSnapshot,
    rules: IctRule[],
    settings: UserSettings,
    events: EconomicEvent[],
    accountBalance: number,
    activeDrawdown: number = 0.0
  ): DecisionResult {
    const trace: string[] = []
    const reasons: string[] = []

    trace.push(`[Start] Evaluated snapshot for pair: ${snapshot.pair}`)

    // 1. Evaluate rules to calculate confluence score
    trace.push(`[Step 1/4] Running Rules Engine evaluation...`)
    const rulesResult = IctRulesEngine.evaluate(snapshot, rules, settings.signal_threshold)
    trace.push(`Rules Engine outputs - Confluence: ${rulesResult.confluenceScore}/10.0, Bias: ${rulesResult.marketBias}`)

    // 2. Compute Position Size Metrics
    trace.push(`[Step 2/4] Calculating position sizing metrics...`)
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
      trace.push(`Position Calculated - Lots: ${positionCalculation.lotSize}, Risk USD: $${positionCalculation.riskAmountUsd}`)
    } else {
      trace.push(`Position sizing skipped - bias is neutral.`)
    }

    // 3. Expected Trading Costs calculation
    trace.push(`[Step 3/4] Estimating broker execution costs...`)
    const lotSizeForCosts = positionCalculation?.lotSize ?? 0.1
    const tradingCost = TradingCostEngine.calculateExpectedExecutionCost(
      snapshot.pair,
      snapshot.spread,
      lotSizeForCosts
    )
    trace.push(`Trading Costs calculated - Total: $${tradingCost.totalCost} (Spread: $${tradingCost.spreadCost}, Comm: $${tradingCost.commission})`)

    // 4. Validate Risk boundaries filters
    trace.push(`[Step 4/4] Evaluating risk boundaries filters...`)
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

    // Build trace validation outputs
    if (riskEvaluation.isSpreadOk) {
      trace.push(`Spread Filter: PASSED (Spread: ${snapshot.spread} pips <= Limit: ${settings.max_spread_allowed} pips)`)
    } else {
      trace.push(`Spread Filter: FAILED (Spread: ${snapshot.spread} pips > Limit: ${settings.max_spread_allowed} pips)`)
      reasons.push(`Spread is too wide (${snapshot.spread} pips)`)
    }

    if (riskEvaluation.isNewsSafe) {
      trace.push(`News Buffer Filter: PASSED (No high-impact economic events within buffer window)`)
    } else {
      trace.push(`News Buffer Filter: FAILED (Collision with event: ${riskEvaluation.collidingNewsEvent})`)
      reasons.push(`High-impact news event collision: ${riskEvaluation.collidingNewsEvent}`)
    }

    if (riskEvaluation.isDrawdownOk) {
      trace.push(`Drawdown Filter: PASSED (Current Drawdown: ${activeDrawdown}% <= Limit: ${settings.daily_drawdown_limit}%)`)
    } else {
      trace.push(`Drawdown Filter: FAILED (Current Drawdown: ${activeDrawdown}% > Limit: ${settings.daily_drawdown_limit}%)`)
      reasons.push(`Daily drawdown limit exceeded (${activeDrawdown}%)`)
    }

    // 5. Decision state coordination
    const isRiskSafe = riskEvaluation.isSpreadOk && riskEvaluation.isNewsSafe && riskEvaluation.isDrawdownOk
    let decision: DecisionType = 'IGNORE'

    if (rulesResult.confluenceScore < 4.00) {
      decision = 'IGNORE'
      reasons.push('Confluence score is below baseline trade criteria.')
    } else if (rulesResult.confluenceScore < settings.signal_threshold) {
      if (isRiskSafe && isBiasTradable) {
        decision = 'WATCH'
        reasons.push('Confluence is moderate. Monitor structure for extra confirmations.')
      } else {
        decision = 'WAIT'
        reasons.push('Confluence is moderate, and execution is blocked by risk parameters.')
      }
    } else {
      // High confluence
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
      decisionTrace: trace
    }
  }
}
