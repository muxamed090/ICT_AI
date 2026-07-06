import { BacktestConfig, BacktestTrade, BacktestReport } from '../types'
import { analyzePerformance } from './PerformanceAnalyzer'

export function generateReport(
    trades: BacktestTrade[],
    config: BacktestConfig
): BacktestReport {
    const closed = trades.filter((t) => t.outcome !== 'pending')
    const analysis = analyzePerformance(trades, config)

    // Per-setup performance
    const setupMap: Record<string, BacktestTrade[]> = {}
    closed.forEach((t) => {
        const key = t.rulesGrade
        if (!setupMap[key]) setupMap[key] = []
        setupMap[key].push(t)
    })

    // Grade distribution
    const gradeDistribution: Record<string, number> = {}
    closed.forEach((t) => {
        gradeDistribution[t.rulesGrade] = (gradeDistribution[t.rulesGrade] ?? 0) + 1
    })

    // Score ranges
    const highScore = closed.filter((t) => t.decisionScore >= 80)
    const midScore = closed.filter((t) => t.decisionScore >= 60 && t.decisionScore < 80)
    const lowScore = closed.filter((t) => t.decisionScore < 60)

    const scoreAnalysis = {
        high: {
            count: highScore.length,
            winRate: highScore.length > 0
                ? parseFloat(((highScore.filter((t) => t.outcome === 'win').length / highScore.length) * 100).toFixed(1))
                : 0,
        },
        mid: {
            count: midScore.length,
            winRate: midScore.length > 0
                ? parseFloat(((midScore.filter((t) => t.outcome === 'win').length / midScore.length) * 100).toFixed(1))
                : 0,
        },
        low: {
            count: lowScore.length,
            winRate: lowScore.length > 0
                ? parseFloat(((lowScore.filter((t) => t.outcome === 'win').length / lowScore.length) * 100).toFixed(1))
                : 0,
        },
    }

    // Consecutive wins/losses
    let maxConsecWins = 0
    let maxConsecLosses = 0
    let curWins = 0
    let curLosses = 0
    closed.forEach((t) => {
        if (t.outcome === 'win') {
            curWins++
            curLosses = 0
            if (curWins > maxConsecWins) maxConsecWins = curWins
        } else if (t.outcome === 'loss') {
            curLosses++
            curWins = 0
            if (curLosses > maxConsecLosses) maxConsecLosses = curLosses
        }
    })

    return {
        config,
        totalTrades: closed.length,
        ...analysis,
        trades,
        generatedAt: new Date().toISOString(),
        gradeDistribution,
        scoreAnalysis,
        maxConsecutiveWins: maxConsecWins,
        maxConsecutiveLosses: maxConsecLosses,
    }
}