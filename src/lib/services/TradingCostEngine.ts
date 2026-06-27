import { TradingCost } from '@/types/database'

export class TradingCostEngine {
  /**
   * Calculates execution costs based on pair spreads and lot sizes.
   */
  static calculateSpreadCost(pair: string, spread: number, lotSize: number): number {
    // Typical FX standard pip value in USD per 1 lot is ~$10
    // Gold (XAUUSD) 1 lot has a pip/tick value of $10 per 0.1 spread
    // BTCUSD standard lot (1 BTC) has tick value corresponding to price move
    const cleanPair = pair.replace('/', '').toUpperCase()
    let pipValueUsd = 10.00 // Default standard major lot pip value in USD

    if (cleanPair === 'BTCUSD') {
      pipValueUsd = 1.00 // 1 point moves = $1
    }

    const spreadCost = lotSize * spread * pipValueUsd
    return Number(spreadCost.toFixed(2))
  }

  /**
   * Flat broker commission is typically $7.00 per standard round turn lot.
   */
  static calculateCommission(lotSize: number): number {
    const flatCommissionPerLot = 7.00
    return Number((lotSize * flatCommissionPerLot).toFixed(2))
  }

  /**
   * Compiles the full execution cost parameters.
   */
  static calculateExpectedExecutionCost(
    pair: string,
    spread: number,
    lotSize: number
  ): TradingCost {
    const spreadCost = this.calculateSpreadCost(pair, spread, lotSize)
    const commission = this.calculateCommission(lotSize)
    const totalCost = Number((spreadCost + commission).toFixed(2))

    return {
      spreadCost,
      commission,
      totalCost
    }
  }
}
