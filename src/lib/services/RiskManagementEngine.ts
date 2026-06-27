import { EconomicEvent, RiskEvaluation } from '@/types/database'

export class RiskManagementEngine {
  /**
   * Validates if the current spread is within user thresholds.
   */
  static checkSpread(currentSpread: number, maxAllowed: number): boolean {
    return currentSpread <= maxAllowed
  }

  /**
   * Scans a list of economic events to check if a high-impact event falls within the lockout buffer.
   */
  static checkNewsCollision(
    currentTime: string,
    events: EconomicEvent[],
    newsBufferMin: number
  ): { isSafe: boolean; collidingEvent: string | null } {
    const current = new Date(currentTime).getTime()
    const bufferMs = newsBufferMin * 60 * 1000

    for (const event of events) {
      if (event.impact !== 'high') {
        continue
      }
      
      const eventTime = new Date(event.event_time).getTime()
      const diffMs = Math.abs(current - eventTime)

      if (diffMs <= bufferMs) {
        return {
          isSafe: false,
          collidingEvent: `${event.event_name} (${event.currency})`
        }
      }
    }

    return { isSafe: true, collidingEvent: null }
  }

  /**
   * Checks if active drawdown is below the risk tolerance limit.
   */
  static checkDrawdown(activeDrawdown: number, limit: number): boolean {
    return activeDrawdown <= limit
  }

  /**
   * Bundles all filter validations.
   */
  static evaluateRisk(
    spread: number,
    maxSpreadAllowed: number,
    currentTime: string,
    events: EconomicEvent[],
    newsBufferMin: number,
    activeDrawdown: number,
    drawdownLimit: number
  ): RiskEvaluation {
    const isSpreadOk = this.checkSpread(spread, maxSpreadAllowed)
    const { isSafe: isNewsSafe, collidingEvent: collidingNewsEvent } = this.checkNewsCollision(
      currentTime,
      events,
      newsBufferMin
    )
    const isDrawdownOk = this.checkDrawdown(activeDrawdown, drawdownLimit)

    return {
      isSpreadOk,
      isNewsSafe,
      isDrawdownOk,
      activeDrawdown,
      collidingNewsEvent
    }
  }
}
