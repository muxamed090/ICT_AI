import { EconomicEvent } from '@/types/database'

const NEWS_BLOCK_MINUTES = 30

export interface TradingStatusResult {
  isBlocked: boolean
  reason: string | null
  blockingEvent: EconomicEvent | null
  minutesUntilClear: number | null
}

export function evaluateTradingStatus(events: EconomicEvent[]): TradingStatusResult {
  const now = new Date()

  const highImpactEvents = events.filter((e) => e.impact === 'high')

  for (const event of highImpactEvents) {
    const eventTime = new Date(event.event_time)
    const diffMs = eventTime.getTime() - now.getTime()
    const diffMin = diffMs / 60000

    const isWithinWindow = diffMin <= NEWS_BLOCK_MINUTES && diffMin >= -NEWS_BLOCK_MINUTES

    if (isWithinWindow) {
      const minutesUntilClear = diffMin > 0
        ? Math.ceil(diffMin + NEWS_BLOCK_MINUTES)
        : Math.ceil(NEWS_BLOCK_MINUTES + diffMin)

      return {
        isBlocked: true,
        reason: `High-impact news event: ${event.event_name} (${event.currency})`,
        blockingEvent: event,
        minutesUntilClear: Math.max(0, minutesUntilClear),
      }
    }
  }

  return {
    isBlocked: false,
    reason: null,
    blockingEvent: null,
    minutesUntilClear: null,
  }
}

export function getNextHighImpactEvent(events: EconomicEvent[]): EconomicEvent | null {
  const now = new Date()
  const future = events
    .filter((e) => e.impact === 'high' && new Date(e.event_time) > now)
    .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())
  return future[0] ?? null
}
