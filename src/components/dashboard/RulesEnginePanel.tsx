"use client"
import React, { useState, useTransition } from 'react'
import { IctRule } from '@/types/database'
import { UserSettings } from '@/types/database'

interface RulesPanelProps {
    rules: IctRule[]
    settings: UserSettings
}

export default function RulesEnginePanel({ rules, settings }: RulesPanelProps) {
    const [localRules, setLocalRules] = useState<IctRule[]>(rules)
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)

    const totalWeight = localRules.reduce((a, r) => a + (r.weight ?? 0), 0)

    function handleWeightChange(id: string, value: number) {
        setLocalRules((prev) =>
            prev.map((r) => (r.id === id ? { ...r, weight: value } : r))
        )
    }

    function handleToggle(id: string) {
        setLocalRules((prev) =>
            prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
        )
    }

    async function handleSave() {
        startTransition(async () => {
            try {
                await fetch('/api/rules/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rules: localRules }),
                })
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            } catch (err) {
                console.error('Save error:', err)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-400">
                        Total Weight: <span className="text-white font-bold">{totalWeight}</span>
                        <span className="text-slate-500"> / 100 recommended</span>
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-xs font-bold transition"
                >
                    {saved ? '✅ Saved' : isPending ? 'Saving...' : '💾 Save Rules'}
                </button>
            </div>

            <div className="space-y-3">
                {localRules.map((rule) => (
                    <div
                        key={rule.id}
                        className={`p-4 rounded-xl border transition ${rule.enabled
                            ? 'border-white/[0.06] bg-white/[0.02]'
                            : 'border-white/[0.03] bg-white/[0.01] opacity-50'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleToggle(rule.id)}
                                    className={`w-8 h-4 rounded-full transition-colors ${rule.enabled ? 'bg-violet-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full bg-white mx-0.5 transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'
                                        }`} />
                                </button>
                                <div>
                                    <p className="text-sm font-bold text-white">{rule.name}</p>
                                    <p className="text-[10px] text-slate-500">{rule.category}</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-violet-400">
                                Weight: {rule.weight}
                            </span>
                        </div>

                        {rule.description && (
                            <p className="text-[10px] text-slate-400 mb-3">{rule.description}</p>
                        )}

                        <input
                            type="range"
                            min={0}
                            max={20}
                            value={rule.weight ?? 10}
                            onChange={(e) => handleWeightChange(rule.id, parseInt(e.target.value))}
                            disabled={!rule.enabled}
                            className="w-full accent-violet-500"
                        />
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">⚙️ Settings</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-slate-500">Max Risk %</p>
                        <p className="text-white font-bold">{settings.risk_percent ?? 1}%</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Max Daily Trades</p>
                        <p className="text-white font-bold">{settings.daily_drawdown_limit ?? 3}%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}