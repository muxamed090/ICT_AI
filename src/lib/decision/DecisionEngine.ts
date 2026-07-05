import { DecisionInput, DecisionOutput } from './types'
import { aggregateSignals } from './core/SignalAggregator'
import { calculateRisk } from './core/RiskCalculator'
import { optimizeEntry } from './core/EntryOptimizer'
import { makeDecision } from './core/DecisionMaker'
import { planExecution } from './core/ExecutionPlanner'

export function runDecisionEngine(input: DecisionInput): DecisionOutput {
    // 1. Aggregate all engine scores
    const aggregated = aggregateSignals(input)

    // 2. Calculate risk plan
    const risk = calculateRisk(input)

    // 3. Optimize entry
    const entry = optimizeEntry(input)

    // 4. Make final decision
    const hasNewsRisk = input.ictResult.recommendation === 'WAIT' && input.rulesResult.recommendation === 'SKIP'
    const { action, executionMode, grade } = makeDecision(
        aggregated,
        input.rulesResult,
        input.mlResult,
        hasNewsRisk,
        input.direction
    )

    // 5. Plan execution
    return planExecution(input, aggregated, risk, entry, action, executionMode, grade)
}