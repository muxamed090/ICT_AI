import { RuleInput, RuleResult } from '../types'

export function runStructureRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []

    // Rule 1: BOS (Break of Structure)
    results.push({
        ruleName: 'Break of Structure (BOS)',
        passed: input.hasBOS ?? false,
        score: (input.hasBOS ?? false) ? 15 : 0,
        reason: (input.hasBOS ?? false)
            ? 'BOS confirmed — trend direction validated'
            : 'No BOS — trend direction unconfirmed',
        warning: !(input.hasBOS ?? false)
            ? 'ICT: BOS is required to confirm trend continuation'
            : undefined,
    })

    // Rule 2: CHoCH (Change of Character)
    results.push({
        ruleName: 'Change of Character (CHoCH)',
        passed: input.hasCHoCH ?? false,
        score: (input.hasCHoCH ?? false) ? 10 : 3,
        reason: (input.hasCHoCH ?? false)
            ? 'CHoCH detected — reversal/continuation signal confirmed'
            : 'No CHoCH — market structure shift unconfirmed',
    })

    // Rule 3: Direction vs structure
    const structureAligned =
        (input.direction === 'buy' && (input.hasBOS ?? false)) ||
        (input.direction === 'sell' && (input.hasBOS ?? false))
    results.push({
        ruleName: 'Structure Alignment',
        passed: structureAligned,
        score: structureAligned ? 10 : 0,
        reason: structureAligned
            ? 'Trade direction aligned with market structure'
            : 'Trade direction conflicts with market structure',
    })

    return results
}