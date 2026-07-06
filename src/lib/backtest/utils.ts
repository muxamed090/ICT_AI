export function generateId(): string {
    return 'bt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

export function getSessionFromHour(hour: number): string {
    if (hour >= 7 && hour < 9) return 'overlap'
    if (hour >= 7 && hour < 16) return 'london'
    if (hour >= 12 && hour < 21) return 'new_york'
    return 'asian'
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}

export function daysBetween(start: string, end: string): number {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    return Math.floor((e - s) / (1000 * 60 * 60 * 24))
}