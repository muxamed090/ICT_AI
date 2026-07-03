export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

export function average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
}

export function getCurrentSession(): 'london' | 'new_york' | 'asian' | 'overlap' {
    const hour = new Date().getUTCHours()
    if (hour >= 7 && hour < 9) return 'overlap'
    if (hour >= 7 && hour < 16) return 'london'
    if (hour >= 12 && hour < 21) return 'new_york'
    return 'asian'
}