import { RuleInput, RuleResult } from '../types'

export function runLiquidityRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []

    // Rule 1: Liquidity sweep present
    results.push({
        ruleName: 'Liquidity Sweep',
        passed: input.hasLiquiditySweep ?? false,
        score: (input.hasLiquiditySweep ?? false) ? 15 : 5,
        reason: (input.hasLiquiditySweep ?? false)
            ? 'Liquidity sweep confirmed — smart money footprint detected'
            : 'No liquidity sweep detected — setup quality reduced',
        warning: !(input.hasLiquiditySweep ?? false)
            ? 'ICT: Always wait for liquidity sweep before entry'
            : undefined,
    })

    // Rule 2: Order Block present
    results.push({
        ruleName: 'Order Block',
        passed: input.hasOrderBlock ?? false,
        score: (input.hasOrderBlock ?? false) ? 10 : 3,
        reason: (input.hasOrderBlock ?? false)
            ? 'Order Block identified — institutional level confirmed'
            : 'No Order Block — entry lacks institutional confirmation',
    })

    // Rule 3: FVG present
    results.push({
        ruleName: 'Fair Value Gap',
        passed: input.hasFVG ?? false,
        score: (input.hasFVG ?? false) ? 10 : 3,
        reason: (input.hasFVG ?? false)
            ? 'FVG present — price imbalance target identified'
            : 'No FVG detected — less precise entry target',
    })

    return results
}