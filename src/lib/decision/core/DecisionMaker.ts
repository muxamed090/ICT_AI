import { AggregatedScore, FinalAction, ExecutionMode } from '../types'
import { RulesEngineOutput } from '@/lib/rules/types'
import { MLOutput } from '@/lib/ml/types'

export function makeDecision(
    aggregated: AggregatedScore,
    rulesResult: RulesEngineOutput,
    mlResult: MLOutput,
    hasNewsRisk: boolean,
    direction: 'buy' | 'sell'
): { action: FinalAction; executionMode: ExecutionMode; grade: 'A' | 'B' | 'C' | 'D' | 'F' } {

    // News override
    if (hasNewsRisk) {
        return { action: 'WAIT', executionMode: 'Manual', grade: 'D' }
    }

    // ML says SKIP
    if (mlResult.prediction.recommendation === 'SKIP') {
        return { action: 'NO TRADE', executionMode: 'Manual', grade: 'F' }
    }

    const score = aggregated.combinedScore
    const rulesGrade = rulesResult.grade
    const mlRec = mlResult.prediction.recommendation

    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    let action: FinalAction
    let executionMode: ExecutionMode

    if (score >= 85 && (rulesGrade === 'A' || rulesGrade === 'B') && mlRec === 'TAKE') {
        grade = 'A'
        action = direction === 'buy' ? 'BUY' : 'SELL'
        executionMode = 'Semi-Auto'
    } else if (score >= 70 && rulesGrade !== 'F' && mlRec === 'TAKE') {
        grade = 'B'
        action = direction === 'buy' ? 'BUY' : 'SELL'
        executionMode = 'Manual'
    } else if (score >= 55) {
        grade = 'C'
        action = 'WAIT'
        executionMode = 'Manual'
    } else if (score >= 40) {
        grade = 'D'
        action = 'WAIT'
        executionMode = 'Manual'
    } else {
        grade = 'F'
        action = 'NO TRADE'
        executionMode = 'Manual'
    }

    return { action, executionMode, grade }
}