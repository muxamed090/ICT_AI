import { DecisionInput, EntryPlan } from '../types'
import { getPip } from '../utils'

export function optimizeEntry(input: DecisionInput): EntryPlan {
    const pip = getPip(input.pair)
    const ictConf = input.ictResult.confidence
    const mlScore = input.mlResult.mlScore
    const rulesPct = (input.rulesResult.totalScore / input.rulesResult.maxScore) * 100

    // If all scores high — use current price as optimal
    // If moderate — slight pullback entry
    let optimalEntry = input.entry
    let entryQuality: EntryPlan['entryQuality']
    let entryReason: string

    if (ictConf >= 80 && mlScore >= 80 && rulesPct >= 75) {
        optimalEntry = input.entry
        entryQuality = 'Excellent'
        entryReason = 'All engines aligned — current price is optimal entry'
    } else if (ictConf >= 65 && mlScore >= 65) {
        // Wait for slight pullback (5 pips)
        optimalEntry = input.direction === 'buy'
            ? input.entry - 5 * pip
            : input.entry + 5 * pip
        entryQuality = 'Good'
        entryReason = 'Moderate confluence — wait for 5-pip pullback entry'
    } else if (ictConf >= 50) {
        // Wait for 10-pip pullback
        optimalEntry = input.direction === 'buy'
            ? input.entry - 10 * pip
            : input.entry + 10 * pip
        entryQuality = 'Fair'
        entryReason = 'Low confluence — wait for 10-pip pullback before entry'
    } else {
        optimalEntry = input.entry
        entryQuality = 'Poor'
        entryReason = 'Poor confluence — avoid entry at current levels'
    }

    return {
        optimalEntry: parseFloat(optimalEntry.toFixed(5)),
        entryQuality,
        entryReason,
    }
}