import { WalkForwardResult, WalkForwardWindow } from '@/types/database'
import { BacktestTradeInput } from './BacktestDataAdapter'

export class WalkForwardEngine {
  /**
   * Evaluates strategy stability by splitting historical trades into rolling windows (In-Sample vs. Out-Of-Sample validation).
   */
  static analyze(trades: BacktestTradeInput[], windowCount: number = 4): WalkForwardResult {
    const completed = trades
      .filter((t) => t.journalEntry.result !== 'pending')
      .sort((a, b) => new Date(a.journalEntry.created_at).getTime() - new Date(b.journalEntry.created_at).getTime())

    if (completed.length < 10) {
      return {
        totalWindows: 0,
        avgEfficiencyRatio: 0,
        robustnessScore: 0,
        windows: [],
      }
    }

    const windows: WalkForwardWindow[] = []
    const tradesPerWindow = Math.floor(completed.length / (windowCount + 1))

    if (tradesPerWindow < 2) {
      return {
        totalWindows: 0,
        avgEfficiencyRatio: 0,
        robustnessScore: 0,
        windows: [],
      }
    }

    for (let w = 0; w < windowCount; w++) {
      const trainStartIdx = w * tradesPerWindow
      const trainEndIdx = trainStartIdx + tradesPerWindow * 2
      const testEndIdx = Math.min(completed.length, trainEndIdx + tradesPerWindow)

      if (trainEndIdx >= completed.length) break

      const trainSlice = completed.slice(trainStartIdx, trainEndIdx)
      const testSlice = completed.slice(trainEndIdx, testEndIdx)

      if (testSlice.length === 0) break

      const inSampleWins = trainSlice.filter((t) => t.journalEntry.result === 'win').length
      const inSampleWinRate = Number(((inSampleWins / trainSlice.length) * 100).toFixed(2))

      const outSampleWins = testSlice.filter((t) => t.journalEntry.result === 'win').length
      const outOfSampleWinRate = Number(((outSampleWins / testSlice.length) * 100).toFixed(2))

      const efficiencyRatio =
        inSampleWinRate > 0
          ? Number(Math.min(2.0, outOfSampleWinRate / inSampleWinRate).toFixed(2))
          : 1.0

      windows.push({
        windowIndex: w + 1,
        trainFrom: trainSlice[0].journalEntry.created_at.split('T')[0],
        trainTo: trainSlice[trainSlice.length - 1].journalEntry.created_at.split('T')[0],
        testFrom: testSlice[0].journalEntry.created_at.split('T')[0],
        testTo: testSlice[testSlice.length - 1].journalEntry.created_at.split('T')[0],
        inSampleWinRate,
        outOfSampleWinRate,
        efficiencyRatio,
      })
    }

    const avgEfficiency =
      windows.length > 0
        ? Number((windows.reduce((acc, w) => acc + w.efficiencyRatio, 0) / windows.length).toFixed(2))
        : 0

    // Robustness score between 0 and 100 based on efficiency stability
    const robustnessScore = Number(Math.min(100, Math.max(0, avgEfficiency * 75)).toFixed(1))

    return {
      totalWindows: windows.length,
      avgEfficiencyRatio: avgEfficiency,
      robustnessScore,
      windows,
    }
  }
}
