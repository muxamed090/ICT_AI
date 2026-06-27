import { PositionCalculation } from '@/types/database'

export class PositionSizeCalculator {
  // Typical reference prices and stop-loss pips for mock modeling
  private static pairConfigs: Record<string, { entry: number; slPips: number; decimals: number }> = {
    EURUSD: { entry: 1.08500, slPips: 20, decimals: 5 },
    GBPUSD: { entry: 1.27000, slPips: 25, decimals: 5 },
    USDJPY: { entry: 155.000, slPips: 30, decimals: 3 },
    XAUUSD: { entry: 2350.00, slPips: 80, decimals: 2 },
    BTCUSD: { entry: 65000.00, slPips: 500, decimals: 2 }
  }

  /**
   * Calculates lot sizes, cash risk thresholds, and stop/limit values.
   */
  static calculate(
    pair: string,
    bias: 'bullish' | 'bearish',
    riskPercent: number,
    riskProfile: 'conservative' | 'balanced' | 'aggressive',
    accountBalance: number
  ): PositionCalculation {
    const cleanPair = pair.replace('/', '').toUpperCase()
    const config = this.pairConfigs[cleanPair] || { entry: 1.00000, slPips: 30, decimals: 5 }

    // 1. Adjust risk percentage by Profile Multiplier
    // Conservative = 0.5x, Balanced = 1.0x, Aggressive = 1.5x
    let multiplier = 1.0
    if (riskProfile === 'conservative') {
      multiplier = 0.5
    } else if (riskProfile === 'aggressive') {
      multiplier = 1.5
    }

    const adjustedRiskPercent = riskPercent * multiplier
    const riskAmountUsd = Number(((accountBalance * adjustedRiskPercent) / 100).toFixed(2))

    // 2. Compute pip pricing metrics
    const decimals = config.decimals
    const isJpy = cleanPair.includes('JPY')
    const pipMultiplier = isJpy ? 100 : 1
    const pipValue = Math.pow(10, -decimals) * pipMultiplier

    // 3. Extrapolate entry, stop-loss, and target levels (1:2 and 1:3 Risk-to-Reward)
    const directionMult = bias === 'bullish' ? 1 : -1
    const entryPrice = config.entry
    const stopLossPips = config.slPips

    const stopLossPrice = Number((entryPrice - directionMult * stopLossPips * pipValue).toFixed(decimals))
    const tp1 = Number((entryPrice + directionMult * stopLossPips * 2 * pipValue).toFixed(decimals))
    const tp2 = Number((entryPrice + directionMult * stopLossPips * 3 * pipValue).toFixed(decimals))

    // 4. Position Sizing logic
    let pipValueUsdPerLot = 10.00 // Standard major FX contract unit
    if (cleanPair === 'BTCUSD') {
      pipValueUsdPerLot = 1.00
    }

    let lotSize = 0.01
    if (stopLossPips > 0 && pipValueUsdPerLot > 0) {
      lotSize = riskAmountUsd / (stopLossPips * pipValueUsdPerLot)
    }

    lotSize = Math.max(0.01, Number(lotSize.toFixed(2)))

    return {
      lotSize,
      riskAmountUsd,
      entryPrice,
      stopLossPrice,
      tp1,
      tp2,
      stopLossPips
    }
  }
}
