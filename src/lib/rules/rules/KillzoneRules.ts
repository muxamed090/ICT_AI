import { RuleInput, RuleResult } from '../types'
import { isKillzone, getKillzoneName } from '../utils'

export function runKillzoneRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []
    const inKillzone = isKillzone()
    const killzoneName = getKillzoneName()

    // Rule: Inside killzone
    results.push({
        ruleName: 'Killzone Entry',
        passed: inKillzone,
        score: inKillzone ? 15 : 5,
        reason: inKillzone
            ? 'Inside killzone: ' + killzoneName + ' — optimal entry window'
            : 'Outside killzone — entry quality reduced',
        warning: !inKillzone ? 'Best entries occur during London Open (07-09 UTC) and NY Open (12-14 UTC)' : undefined,
    })

    // Rule: Killzone + pair match
    const kz = input.killzone ?? killzoneName ?? ''
    const pair = input.pair
    let kzPairOk = true
    let kzPairReason = 'Killzone-pair combination acceptable'

    if (kz.includes('London') && (pair === 'EURUSD' || pair === 'GBPUSD' || pair === 'EURJPY')) {
        kzPairReason = 'London Open + EUR/GBP pairs — premium setup'
    } else if (kz.includes('NY') && (pair === 'USDCAD' || pair === 'XAUUSD')) {
        kzPairReason = 'NY Open + USD/XAU pairs — premium setup'
    } else if (kz.includes('Asian') && pair !== 'USDJPY') {
        kzPairOk = false
        kzPairReason = 'Asian killzone best for JPY pairs only'
    }

    results.push({
        ruleName: 'Killzone-Pair Match',
        passed: kzPairOk,
        score: kzPairOk ? 10 : 0,
        reason: kzPairReason,
    })

    return results
}