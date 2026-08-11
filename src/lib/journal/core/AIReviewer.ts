import { JournalEntry, AIReview } from '../types'

export function reviewTrade(entry: JournalEntry): AIReview {
    const strengths: string[] = []
    const weaknesses: string[] = []
    let confluenceScore = 50
    let rating = 5

    // Entry quality
    let entryQuality: AIReview['entryQuality']
    if (entry.risk_reward >= 2 && (entry.ai_confidence ?? 0) >= 80) {
        entryQuality = 'Excellent'
        strengths.push('Excellent R:R ' + entry.risk_reward + ' with high AI confidence')
        confluenceScore += 20
        rating += 2
    } else if (entry.risk_reward >= 1.5) {
        entryQuality = 'Good'
        strengths.push('Good R:R ratio: ' + entry.risk_reward)
        confluenceScore += 10
        rating += 1
    } else if (entry.risk_reward >= 1) {
        entryQuality = 'Fair'
        weaknesses.push('R:R ' + entry.risk_reward + ' is below recommended 1.5')
        confluenceScore -= 5
    } else {
        entryQuality = 'Poor'
        weaknesses.push('Poor R:R ' + entry.risk_reward + ' — avoid trades below 1:1')
        confluenceScore -= 15
        rating -= 2
    }

    // Risk management
    let riskManagement: AIReview['riskManagement']
    if (entry.risk_reward >= 1.5 && entry.stop_loss > 0) {
        riskManagement = 'Good'
        strengths.push('Stop loss properly placed')
    } else if (entry.stop_loss > 0) {
        riskManagement = 'Acceptable'
    } else {
        riskManagement = 'Poor'
        weaknesses.push('No stop loss detected')
        rating -= 2
    }

    // Session quality
    if (entry.session === 'london' || entry.session === 'overlap') {
        strengths.push('Traded during optimal ' + entry.session + ' session')
        confluenceScore += 10
    } else if (entry.session === 'asian') {
        weaknesses.push('Asian session has lower liquidity')
        confluenceScore -= 10
    }

    // Result analysis
    if (entry.result === 'win') {
        strengths.push('Trade closed profitably: +$' + entry.pnl.toFixed(2))
        rating += 1
    } else if (entry.result === 'loss') {
        weaknesses.push('Trade closed at loss: -$' + Math.abs(entry.pnl).toFixed(2))
        rating -= 1
    }

    // Killzone bonus
    if (entry.killzone) {
        strengths.push('Entry during ' + entry.killzone + ' killzone')
        confluenceScore += 5
    }

    // Lesson
    let lesson = ''
    if (entry.result === 'win' && entry.risk_reward >= 2) {
        lesson = 'High-quality setup — replicate this pattern with same session and setup type.'
    } else if (entry.result === 'loss' && entry.risk_reward < 1.5) {
        lesson = 'Avoid low R:R setups. Wait for minimum 1.5 R:R before entering.'
    } else if (entry.result === 'loss') {
        lesson = 'Review entry timing and confluence. Consider waiting for killzone entries.'
    } else {
        lesson = 'Good discipline shown. Continue following the trading plan.'
    }

    return {
        pair: entry.pair,
        direction: entry.direction,
        setup: entry.setup_type,
        entryQuality,
        riskManagement,
        confluenceScore: Math.min(100, Math.max(0, confluenceScore)),
        strengths,
        weaknesses,
        lesson,
        rating: Math.min(10, Math.max(1, rating)),
    }
}