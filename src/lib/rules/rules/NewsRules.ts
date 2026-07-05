import { RuleInput, RuleResult } from '../types'

export function runNewsRules(input: RuleInput): RuleResult[] {
    const results: RuleResult[] = []
    const mins = input.minutesToNews ?? 999

    // Rule 1: No high impact news within 30 min
    const newsClear = !input.hasNewsRisk && mins > 30
    results.push({
        ruleName: 'News Filter',
        passed: newsClear,
        score: newsClear ? 15 : 0,
        reason: newsClear
            ? 'No high-impact news within 30 minutes — safe to trade'
            : 'High-impact news in ' + (mins < 999 ? mins + ' min' : 'unknown') + ' — avoid entry',
        warning: input.hasNewsRisk ? input.newsWarning ?? 'High impact news risk' : undefined,
    })

    // Rule 2: Post-news clarity (wait 15 min after news)
    const postNewsClear = mins > 15
    results.push({
        ruleName: 'Post-News Clarity',
        passed: postNewsClear,
        score: postNewsClear ? 5 : 0,
        reason: postNewsClear
            ? 'Sufficient time buffer from news event'
            : 'Too close to news — market may be volatile',
    })

    return results
}