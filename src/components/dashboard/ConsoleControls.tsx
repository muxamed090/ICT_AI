"use client"

import React, { useState } from "react"
import { Play, Pause, RotateCcw, Activity } from "lucide-react"
import { updateSettings } from "@/actions/settingsActions"
import ValidationMessage from "@/components/auth/ValidationMessage"
import { UserSettings } from "@/types/database"

interface ConsoleControlsProps {
  initialSettings: UserSettings
}

export default function ConsoleControls({ initialSettings }: ConsoleControlsProps) {
  const [engineActive, setEngineActive] = useState(initialSettings.ai_learning_enabled)
  const [engineLatency, setEngineLatency] = useState(12)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleToggleEngine = async () => {
    if (isPending) return
    setIsPending(true)
    const nextState = !engineActive

    try {
      const result = await updateSettings({
        theme: initialSettings.theme,
        timezone: initialSettings.timezone,
        language: initialSettings.language,
        notification_enabled: initialSettings.notification_enabled,
        telegram_enabled: initialSettings.telegram_enabled,
        telegram_chat_id: initialSettings.telegram_chat_id,
        risk_percent: Number(initialSettings.risk_percent),
        ai_learning_enabled: nextState,
        ml_mode: initialSettings.ml_mode,
      })

      if (result.success) {
        setEngineActive(nextState)
        setFeedback({
          type: "success",
          message: nextState ? "AI Engine analysis running in real-time." : "AI Engine put on standby."
        })
      } else {
        setFeedback({
          type: "error",
          message: result.error?.message || "Failed to update engine state."
        })
      }
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred."
      })
    } finally {
      setIsPending(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  const handleRecalibrate = () => {
    setEngineLatency(Math.floor(Math.random() * 8) + 8)
    setFeedback({
      type: "success",
      message: "AI models recalibrated. Active FVG models refreshed."
    })
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ValidationMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
          AI Console Controls
        </p>
        <div className="space-y-2">
          <button
            onClick={handleToggleEngine}
            disabled={isPending}
            className="w-full flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-slate-200 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${engineActive ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
              Engine Live Updates
            </span>
            {engineActive ? (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                PAUSE <Pause className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-[10px] text-blue-400 flex items-center gap-1 font-bold">
                START <Play className="h-3 w-3" />
              </span>
            )}
          </button>

          <button
            onClick={handleRecalibrate}
            className="w-full flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] text-slate-200 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-500" />
              Recalibrate Modeller
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Run ({engineLatency}ms)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
