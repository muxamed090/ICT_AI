import { SignalInput, MomentumResult } from '../types'

export function runMomentumEngine(signal: SignalInput): MomentumResult {
    const reasons: string[] = []
    let momentum: 'Strong' | 'Moderate' | 'Weak'
    if (signal.score >= 80 && signal.confidence >= 80) {
        momentum = 'Strong'
        reasons.push('Score & Confidence both ≥ 80 → Strong momentum')
    } else if (signal.score >= 60) {
        momentum = 'Moderate'
        reasons.push(`Score ${signal.score} → Moderate momentum`)
    } else {
        momentum = 'Weak'
        reasons.push(`Score ${signal.score} < 60 → Weak momentum`)
    }
    return { momentum, reasons }
}