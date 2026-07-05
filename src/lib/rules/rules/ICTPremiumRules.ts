import { RuleInput, RuleResult } from '../types'

export function runICTPremiumRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []

    // Rule 1: Premium/Discount arrays
    // Buy in discount (below 50% of range), Sell in premium (above 50%)
    const range = Math.abs(input.tp2 - input.stop_loss)
    const mid = input.stop_loss + range / 2
    const inDiscount = input.price < mid
    const inPremium = input.price > mid

    const priceLocationOk =
        (input.direction === 'buy' && inDiscount) ||
        (input.direction === 'sell' && inPremium)

    results.push({
        ruleName: 'Premium/Discount Array',
        passed: priceLocationOk,
        score: priceLocationOk ? 10 : 0,
        reason: priceLocationOk
            ? input.direction === 'buy'
                ? 'Buying in Discount — optimal ICT entry zone'
                : 'Selling in Premium — optimal ICT entry zone'
            : input.direction === 'buy'
                ? 'Price in Premium zone — avoid buying here'
                : 'Price in Discount zone — avoid selling here',
        warning: !priceLocationOk
            ? 'ICT: Buy in Discount, Sell in Premium'
            : undefined,
    })

    // Rule 2: Minimum R:R ratio
    const rr = Math.abs(input.tp1 - input.entry) / Math.abs(input.entry - input.stop_loss)
    const rrOk = rr >= 1.5
    results.push({
        ruleName: 'Risk/Reward Minimum',
        passed: rrOk,
        score: rrOk ? 10 : 0,
        reason: rrOk
            ? 'R:R ' + rr.toFixed(2) + ' meets minimum 1.5 requirement'
            : 'R:R ' + rr.toFixed(2) + ' below minimum 1.5 — skip trade',
        warning: !rrOk ? 'Minimum R:R for ICT setups is 1:1.5' : undefined,
    })

    // Rule 3: Spread check
    const spread = input.spreadPips ?? 0
    const spreadOk = spread < 3
    results.push({
        ruleName: 'Spread Filter',
        passed: spreadOk,
        score: spreadOk ? 5 : 0,
        reason: spreadOk
            ? 'Spread acceptable — execution cost low'
            : 'Spread too wide — execution cost high',
    })

    return results
}