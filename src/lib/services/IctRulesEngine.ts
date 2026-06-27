import { MarketSnapshot, IctRule, RuleResult, EngineResult } from '@/types/database'

export class IctRulesEngine {
  /**
   * Evaluates a market snapshot against a list of active ICT rules.
   * 
   * @param snapshot The current market snapshot containing technical readings
   * @param rules List of the user's custom rule weight and status configurations
   * @param signalThreshold The custom score threshold above which ENTRY is suggested (default: 7.0)
   */
  static evaluate(
    snapshot: MarketSnapshot,
    rules: IctRule[],
    signalThreshold: number = 7.00
  ): EngineResult {
    const triggeredRules: RuleResult[] = []
    let totalEnabledWeight = 0
    let triggeredWeightSum = 0

    // Evaluate each rule
    for (const rule of rules) {
      if (!rule.enabled) {
        continue
      }

      totalEnabledWeight += Number(rule.weight)
      let isTriggered = false
      const conditions = rule.conditions || {}

      switch (rule.rule_key) {
        case 'mss_choch':
          // Triggered if there is a BOS or CHoCH break
          isTriggered = snapshot.bos || snapshot.choch
          break

        case 'fvg_retest':
          // Triggered if there is a BISI or SIBI FVG
          isTriggered = snapshot.fvg_type !== 'none'
          break

        case 'liquidity_sweep':
          // Triggered if there is a liquidity sweep high or low
          isTriggered = snapshot.liquidity_sweep === 'high' || snapshot.liquidity_sweep === 'low'
          break

        case 'killzone_timing':
          // Triggered if we are in a valid ICT Killzone
          isTriggered = snapshot.killzone !== 'none'
          break

        case 'ote_retracement':
          // Triggered if price has retraced into OTE levels
          isTriggered = snapshot.ote
          break

        case 'htf_bias':
          // Triggered if the execution timeframe trend aligns with HTF structure
          isTriggered = 
            (snapshot.htf_bias === 'bullish' && snapshot.trend === 'bullish') ||
            (snapshot.htf_bias === 'bearish' && snapshot.trend === 'bearish')
          break

        case 'risk_constraint':
          // Triggered if spread is low and volume is healthy
          const maxSpread = typeof conditions.max_spread_pips === 'number'
            ? conditions.max_spread_pips
            : 2.5
          const isSpreadValid = snapshot.spread <= maxSpread
          const isVolumeValid = snapshot.volume !== 'low'
          isTriggered = isSpreadValid && isVolumeValid
          break

        default:
          break
      }

      const scoreContribution = isTriggered ? Number(rule.weight) : 0
      triggeredWeightSum += scoreContribution

      triggeredRules.push({
        ruleKey: rule.rule_key,
        name: rule.name,
        category: rule.category,
        weight: Number(rule.weight),
        enabled: rule.enabled,
        isTriggered,
        scoreContribution
      })
    }

    // Calculations
    const confluenceScore = totalEnabledWeight > 0
      ? Number(((triggeredWeightSum / totalEnabledWeight) * 10).toFixed(2))
      : 0
    
    const confidence = totalEnabledWeight > 0
      ? Number(((triggeredWeightSum / totalEnabledWeight) * 100).toFixed(2))
      : 0

    // Market Bias derivation
    let bullishScore = 0
    let bearishScore = 0

    if (snapshot.trend === 'bullish') bullishScore += 1
    if (snapshot.trend === 'bearish') bearishScore += 1

    if (snapshot.htf_bias === 'bullish') bullishScore += 2
    if (snapshot.htf_bias === 'bearish') bearishScore += 2

    // Sweep of liquidity low triggers bullish setup; sweep high triggers bearish setup
    if (snapshot.liquidity_sweep === 'low') bullishScore += 2
    if (snapshot.liquidity_sweep === 'high') bearishScore += 2

    if (snapshot.fvg_type === 'bisi') bullishScore += 1.5
    if (snapshot.fvg_type === 'sibi') bearishScore += 1.5

    let marketBias: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (confluenceScore >= 4.0) {
      if (bullishScore > bearishScore + 1.0) {
        marketBias = 'bullish'
      } else if (bearishScore > bullishScore + 1.0) {
        marketBias = 'bearish'
      }
    }

    // Recommendation trigger
    let recommendation: 'WAIT' | 'WATCH' | 'ENTRY' = 'WAIT'
    if (confluenceScore >= signalThreshold) {
      recommendation = marketBias !== 'neutral' ? 'ENTRY' : 'WATCH'
    } else if (confluenceScore >= 4.50) {
      recommendation = 'WATCH'
    } else {
      recommendation = 'WAIT'
    }

    // Markdown Explanation Builder
    const activeTriggered = triggeredRules.filter(r => r.isTriggered)
    const activeUntriggered = triggeredRules.filter(r => !r.isTriggered)

    let explanation = `### ICT Confluence Analysis: ${snapshot.pair}\n\n`
    explanation += `The engine analyzed the current market snapshot on **${snapshot.timeframe}** and computed a **Confluence Score of ${confluenceScore.toFixed(1)}/10.0** (${confidence.toFixed(0)}% confidence).\n\n`
    
    if (recommendation === 'ENTRY') {
      explanation += `**Recommendation:** 🟢 **${recommendation}** - High probability **${marketBias.toUpperCase()}** setup detected aligning with configured rules.\n\n`
    } else if (recommendation === 'WATCH') {
      explanation += `**Recommendation:** 🟡 **${recommendation}** - Moderate confluence detected. Keep monitoring structural parameters.\n\n`
    } else {
      explanation += `**Recommendation:** 🔴 **${recommendation}** - Insufficient alignment. Stand aside and wait for key sweeps or shifts.\n\n`
    }

    explanation += `#### Triggered Confluences (${activeTriggered.length}):\n`
    if (activeTriggered.length > 0) {
      activeTriggered.forEach(r => {
        explanation += `- **[${r.category.toUpperCase()}]** ${r.name} *(Weight: ${r.weight.toFixed(1)})*\n`
      })
    } else {
      explanation += `- None\n`
    }

    explanation += `\n#### Missing/Untriggered Conditions (${activeUntriggered.length}):\n`
    if (activeUntriggered.length > 0) {
      activeUntriggered.forEach(r => {
        explanation += `- **[${r.category.toUpperCase()}]** ${r.name} *(Weight: ${r.weight.toFixed(1)})*\n`
      })
    } else {
      explanation += `- None\n`
    }

    explanation += `\n*Analysis executed using Rule Version v1.0.0 (Rules Engine v2.0).*`

    return {
      confluenceScore,
      confidence,
      marketBias,
      triggeredRules,
      explanation,
      recommendation
    }
  }
}
