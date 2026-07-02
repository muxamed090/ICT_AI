import { SignalInput, RiskResult } from '../types'
import { calcRiskReward } from '../utils'

export function runRiskEngine(signal: SignalInput): RiskResult {
    const warnings: string[] = []
    if (signal.hasNewsRisk) {
        return {
            risk: 'High',
            riskRewardRatio: 0,
            warnings: [signal.newsWarning ?? 'High impact news approaching'],
            blocked: true,
            blockReason: signal.newsWarning ?? 'High impact news risk',
        }
    }
    const rr = calcRiskReward(signal.entry, signal.stop_loss, signal.tp1)
    let risk: 'Low' | 'Medium' | 'High'
    if (rr >= 2 && signal.confidence >= 75) risk = 'Low'
    else if (rr >= 1.5 && signal.confidence >= 55) risk = 'Medium'
    else risk = 'High'
    if (rr < 1.5) warnings.push('Risk/Reward below 1.5 — consider skipping')
    return { risk, riskRewardRatio: rr, warnings, blocked: false }
}