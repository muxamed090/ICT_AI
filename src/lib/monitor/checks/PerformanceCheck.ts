import { PerformanceMetrics } from '../types'

export function checkPerformance(
    responseTimes: number[],
    errorCount: number,
    totalRequests: number,
    uptimeMs: number
): PerformanceMetrics {
    const avgResponseTime = responseTimes.length > 0
        ? parseFloat((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0))
        : 0

    const errorRate = totalRequests > 0
        ? parseFloat(((errorCount / totalRequests) * 100).toFixed(1))
        : 0

    const uptime = parseFloat(((uptimeMs / (1000 * 60 * 60)) % 24).toFixed(1))

    return { avgResponseTime, totalRequests, errorRate, uptime }
}