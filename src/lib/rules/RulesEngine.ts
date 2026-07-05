import { RuleInput, RulesEngineOutput } from './types'
import { runSessionRules } from './rules/SessionRules'
import { runKillzoneRules } from './rules/KillzoneRules'
import { runNewsRules } from './rules/NewsRules'
import { runLiquidityRules } from './rules/LiquidityRules'
import { runStructureRules } from './rules/StructureRules'
import { runMultiTimeframeRules } from './rules/MultiTimeframeRules'
import { runICTPremiumRules } from './rules/ICTPremiumRules'

export function runRulesEngine(input: RuleInput): RulesEngineOutput {
    // Run all rule modules
    const allResults = [
        ...runSessionRules(input),
        ...runKillzoneRules(input),
        ...runNewsRules(input),
        ...runLiquidityRules(input),
        ...runStructureRules(input),
        ...runMultiTimeframeRules(input),
        ...runICTPremiumRules(input),
    ]

    const totalScore = allResults.reduce((a, r) => a + r.score, 0)
    const maxScore = 150
    const pct = (totalScore / maxScore) * 100
    const passedRules = allResults.filter((r) => r.passed).length
    const failedRules = allResults.filter((r) => !r.passed).length

    // Grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (pct >= 85) grade = 'A'
    else if (pct >= 70) grade = 'B'
    else if (pct >= 55) grade = 'C'
    else if (pct >= 40) grade = 'D'
    else grade = 'F'

    // Recommendation
    let recommendation: 'EXECUTE' | 'REVIEW' | 'SKIP'
    if (grade === 'A' || grade === 'B') recommendation = 'EXECUTE'
    else if (grade === 'C') recommendation = 'REVIEW'
    else recommendation = 'SKIP'

    // News override
    if (input.hasNewsRisk) {
        recommendation = 'SKIP'
    }

    const summary =
        recommendation + ' — Score: ' + totalScore + '/' + maxScore +
        ' (' + pct.toFixed(0) + '%) | Grade: ' + grade +
        ' | Rules: ' + passedRules + '/' + allResults.length + ' passed'

    return {
        passed: recommendation !== 'SKIP',
        totalScore,
        maxScore,
        grade,
        results: allResults,
        passedRules,
        failedRules,
        recommendation,
        summary,
    }
}