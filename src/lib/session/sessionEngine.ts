import { SessionDefinition, sessionsConfig } from './sessionConfig'

export interface ActiveSession {
  name: string
  color: string
}

export interface SessionState {
  activeSessions: ActiveSession[]
  isOverlap: boolean
  overlapLabel: string | null
  nextSession: SessionDefinition | null
  nextSessionStartsInMs: number
  currentUtcHour: number
  currentUtcMinute: number
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

export function getSessionState(now?: Date): SessionState {
  const utc = now ?? new Date()
  const currentUtcHour = utc.getUTCHours()
  const currentUtcMinute = utc.getUTCMinutes()
  const currentMinutes = toMinutes(currentUtcHour, currentUtcMinute)

  const activeSessions: ActiveSession[] = sessionsConfig
    .filter((s) => {
      const start = toMinutes(s.startHour, s.startMinute)
      const end = toMinutes(s.endHour, s.endMinute)
      return currentMinutes >= start && currentMinutes < end
    })
    .map((s) => ({ name: s.name, color: s.color }))

  const isOverlap = activeSessions.length > 1
  const overlapLabel = isOverlap
    ? activeSessions.map((s) => s.name).join(' & ') + ' Overlap'
    : null

  // Find next session that hasn't started yet today
  let nextSession: SessionDefinition | null = null
  let nextSessionStartsInMs = Infinity

  for (const s of sessionsConfig) {
    const startMinutes = toMinutes(s.startHour, s.startMinute)
    const diffMinutes = startMinutes - currentMinutes

    if (diffMinutes > 0 && diffMinutes < nextSessionStartsInMs / 60000) {
      nextSession = s
      nextSessionStartsInMs = diffMinutes * 60 * 1000
    }
  }

  // Wrap overnight if no session found ahead today — pick first session of tomorrow
  if (!nextSession) {
    const firstSession = sessionsConfig.reduce((prev, curr) =>
      toMinutes(prev.startHour, prev.startMinute) < toMinutes(curr.startHour, curr.startMinute) ? prev : curr
    )
    nextSession = firstSession
    const remainingTodayMinutes = 1440 - currentMinutes
    const startMinutesTomorrow = toMinutes(firstSession.startHour, firstSession.startMinute)
    nextSessionStartsInMs = (remainingTodayMinutes + startMinutesTomorrow) * 60 * 1000
  }

  return {
    activeSessions,
    isOverlap,
    overlapLabel,
    nextSession,
    nextSessionStartsInMs,
    currentUtcHour,
    currentUtcMinute,
  }
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}
