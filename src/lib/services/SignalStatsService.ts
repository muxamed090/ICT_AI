import { Signal } from '@/types/database'

export interface SignalStats {
  totalSignals: number
  activeCount: number
  pendingCount: number
  completedCount: number
  expiredCount: number
  cancelledCount: number
  avgConfidence: number
  avgScore: number
}

export function computeSignalStats(signals: Signal[]): SignalStats {
  const activeCount = signals.filter((s) => s.status === 'active').length
  const pendingCount = signals.filter((s) => s.status === 'pending').length
  const completedCount = signals.filter((s) => s.status === 'completed').length
  const expiredCount = signals.filter((s) => s.status === 'expired').length
  const cancelledCount = signals.filter((s) => s.status === 'cancelled').length

  const avgConfidence = signals.length > 0
    ? signals.reduce((acc, s) => acc + Number(s.confidence), 0) / signals.length
    : 0

  const avgScore = signals.length > 0
    ? signals.reduce((acc, s) => acc + Number(s.score), 0) / signals.length
    : 0

  return {
    totalSignals: signals.length,
    activeCount,
    pendingCount,
    completedCount,
    expiredCount,
    cancelledCount,
    avgConfidence,
    avgScore,
  }
}
