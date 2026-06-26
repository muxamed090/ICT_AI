export interface SessionDefinition {
  name: string
  startHour: number    // UTC 24h
  startMinute: number
  endHour: number      // UTC 24h
  endMinute: number
  timezone: 'UTC'
  color: string        // Tailwind badge colour class
}

export const sessionsConfig: SessionDefinition[] = [
  {
    name: 'Asia',
    startHour: 0,
    startMinute: 0,
    endHour: 9,
    endMinute: 0,
    timezone: 'UTC',
    color: 'text-blue-400',
  },
  {
    name: 'London',
    startHour: 8,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    timezone: 'UTC',
    color: 'text-amber-400',
  },
  {
    name: 'New York',
    startHour: 13,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
    timezone: 'UTC',
    color: 'text-emerald-400',
  },
]
