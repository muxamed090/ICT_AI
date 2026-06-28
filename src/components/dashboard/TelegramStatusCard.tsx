'use client'

import React, { useState, useTransition } from 'react'
import {
  Send, RefreshCw, CheckCircle2, XCircle, Clock,
  MessageSquare, AlertTriangle, Loader2
} from 'lucide-react'
import { TelegramStatusResult, NotificationLog } from '@/types/database'
import { sendTelegramTest, processNotificationQueue } from '@/actions/telegramActions'

interface TelegramStatusCardProps {
  status: TelegramStatusResult
  recentLogs: NotificationLog[]
}

const STATUS_CONFIG = {
  sent: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  failed: { icon: <XCircle className="h-3 w-3" />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  skipped: { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
} as const

export default function TelegramStatusCard({
  status: initialStatus,
  recentLogs,
}: TelegramStatusCardProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isTesting, startTestTransition] = useTransition()
  const [isProcessing, startProcessTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSendTest = () => {
    setFeedback(null)
    startTestTransition(async () => {
      const result = await sendTelegramTest()
      if (result.success) {
        setFeedback({ type: 'success', message: 'Test message sent successfully!' })
        setStatus((prev) => ({
          ...prev,
          todayMessageCount: prev.todayMessageCount + 1,
          lastMessageAt: new Date().toISOString(),
        }))
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Failed to send test message.' })
      }
      setTimeout(() => setFeedback(null), 5000)
    })
  }

  const handleProcessQueue = () => {
    setFeedback(null)
    startProcessTransition(async () => {
      const result = await processNotificationQueue()
      if (result.success && result.data) {
        const { processed, succeeded, failed } = result.data
        setFeedback({
          type: failed > 0 ? 'error' : 'success',
          message: `Queue: ${processed} processed, ${succeeded} sent, ${failed} failed.`,
        })
        setStatus((prev) => ({
          ...prev,
          todayMessageCount: prev.todayMessageCount + succeeded,
          pendingQueueCount: Math.max(0, prev.pendingQueueCount - succeeded),
        }))
      } else {
        setFeedback({ type: 'error', message: result.error?.message ?? 'Failed to process queue.' })
      }
      setTimeout(() => setFeedback(null), 5000)
    })
  }

  const isFullyConfigured = status.botConfigured && status.chatIdConfigured && status.telegramEnabled

  return (
    <div className="space-y-5">

      {/* ── Connection Status Banner ─────────────────────────── */}
      <div className={`rounded-xl border p-4 ${
        isFullyConfigured
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${
              isFullyConfigured
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
            }`} />
            <div>
              <p className="text-sm font-bold text-white">
                {isFullyConfigured ? 'Telegram Connected' : 'Telegram Not Ready'}
              </p>
              <p className="text-[10px] text-slate-500">
                {!status.botConfigured && 'Bot token missing · '}
                {!status.chatIdConfigured && 'Chat ID not set · '}
                {!status.telegramEnabled && 'Telegram disabled · '}
                {isFullyConfigured && 'All systems operational'}
              </p>
            </div>
          </div>
          <Send className={`h-4 w-4 ${isFullyConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
        </div>
      </div>

      {/* ── Status Metrics ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-3">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> Today
          </p>
          <p className="text-xl font-bold text-white">{status.todayMessageCount}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-3">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </p>
          <p className={`text-xl font-bold ${status.pendingQueueCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {status.pendingQueueCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-3">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </p>
          <p className={`text-xl font-bold ${status.failedQueueCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {status.failedQueueCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-3">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Last Sent
          </p>
          <p className="text-xs font-bold text-slate-300">
            {status.lastMessageAt
              ? new Date(status.lastMessageAt).toLocaleTimeString()
              : 'Never'}
          </p>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={handleSendTest}
          disabled={isTesting || !isFullyConfigured}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-40 cursor-pointer"
        >
          {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Send Test
        </button>
        <button
          onClick={handleProcessQueue}
          disabled={isProcessing || status.pendingQueueCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-600/30 transition-all disabled:opacity-40 cursor-pointer"
        >
          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Retry Queue ({status.pendingQueueCount})
        </button>
      </div>

      {/* ── Feedback ─────────────────────────────────────────── */}
      {feedback && (
        <p className={`text-[10px] font-mono ${feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {feedback.message}
        </p>
      )}

      {/* ── Recent Notification Logs ─────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            Recent Telegram Logs
          </h3>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="py-10 text-center">
              <Send className="h-7 w-7 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No Telegram logs yet</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0A1019]">
                <tr className="border-b border-white/[0.06]">
                  {['Time', 'Status', 'Event', 'Message'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-500 uppercase tracking-widest text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const config = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.skipped
                  return (
                    <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors last:border-0">
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${config.color} ${config.bg}`}>
                          {config.icon}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 capitalize">
                        {log.event_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-[200px] truncate" title={log.error_message ?? log.message_text}>
                        {log.error_message ?? log.message_text.substring(0, 60)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
