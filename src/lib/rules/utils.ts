export function getCurrentUTCHour(): number {
    return new Date().getUTCHours()
}

export function isLondonSession(): boolean {
    const h = getCurrentUTCHour()
    return h >= 7 && h < 16
}

export function isNewYorkSession(): boolean {
    const h = getCurrentUTCHour()
    return h >= 12 && h < 21
}

export function isAsianSession(): boolean {
    const h = getCurrentUTCHour()
    return h >= 0 && h < 7
}

export function isOverlap(): boolean {
    const h = getCurrentUTCHour()
    return h >= 12 && h < 16
}

export function isKillzone(): boolean {
    const h = getCurrentUTCHour()
    // London Open: 7-9, NY Open: 12-14, London Close: 15-16
    return (h >= 7 && h < 9) || (h >= 12 && h < 14) || (h === 15)
}

export function getKillzoneName(): string | null {
    const h = getCurrentUTCHour()
    if (h >= 7 && h < 9) return 'London Open'
    if (h >= 12 && h < 14) return 'NY Open'
    if (h === 15) return 'London Close'
    if (h >= 2 && h < 4) return 'Asian Killzone'
    return null
}