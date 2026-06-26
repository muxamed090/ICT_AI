import { AiAnalysis } from '@/types/database'

export interface AiAnalysisStats {
  totalAnalyses: number
  avgConfluence: number
  avgConfidence: number
  biasCounts: { bullish: number; bearish: number; neutral: number }
  dominantBias: string
  dominantBiasTrend: 'up' | 'down' | 'neutral'
}

export function computeAiAnalysisStats(analyses: AiAnalysis[]): AiAnalysisStats {
  const avgConfluence = analyses.length > 0
    ? analyses.reduce((acc, a) => acc + Number(a.confluence_score), 0) / analyses.length
    : 0

  const avgConfidence = analyses.length > 0
    ? analyses.reduce((acc, a) => acc + Number(a.confidence), 0) / analyses.length
    : 0

  const biasCounts = { bullish: 0, bearish: 0, neutral: 0 }
  for (const a of analyses) {
    biasCounts[a.market_bias]++
  }

  const sorted = Object.entries(biasCounts).sort((a, b) => b[1] - a[1])
  const dominantBias = sorted[0] ? `${sorted[0][0].toUpperCase()} (${sorted[0][1]})` : 'N/A'
  const dominantKey = sorted[0]?.[0] ?? 'neutral'
  const dominantBiasTrend: 'up' | 'down' | 'neutral' =
    dominantKey === 'bullish' ? 'up' : dominantKey === 'bearish' ? 'down' : 'neutral'

  return {
    totalAnalyses: analyses.length,
    avgConfluence,
    avgConfidence,
    biasCounts,
    dominantBias,
    dominantBiasTrend,
  }
}
