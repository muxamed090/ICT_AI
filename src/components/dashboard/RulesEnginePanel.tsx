'use client'

import React, { useState } from 'react'
import { RulesEngineOutput, RuleResult } from '@/lib/rules/types'

interface RulesResult {
  pair: string
  direction: 'buy' | 'sell'
  price: number
  rulesResult: RulesEngineOutput
}

const gradeColor: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  B: 'text-blue-400    bg-blue-500/10    border-blue-500/20',
  C: 'text-amber-400   bg-amber-500/10   border-amber-500/20',
  D: 'text-orange-400  bg-orange-500/10  border-orange-500/20',
  F: 'text-rose-400    bg-rose-500/10    border-rose-500/20',
}

const recColor: Record<string, string> = {
  EXECUTE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  REVIEW: 'text-amber-400  bg-amber-500/10   border-amber-500/20',
  SKIP: 'text-rose-400   bg-rose-500/10    border-rose-500/20',
}

function RuleRow({ rule }: { rule: RuleResult }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${rule.passed ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-rose-500/10 bg-rose-500/5'
      }`}>
      <span className="text-sm mt-0.5">{rule.passed ? '✅' : '❌'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-white">{rule.ruleName}</p>
          <span className={`text-[10px] font-mono font-bold ${rule.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            +{rule.score}pts
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{rule.reason}</p>
        {rule.warning && (
          <p className="text-[10px] text-amber-400 mt-0.5">⚠️ {rule.warning}</p>
        )}
      </div>
    </div>
  )
}

export default function RulesEnginePanel({
  results,
  session,
  killzone,
}: {
  results: RulesResult[]
  session: string
  killzone: string | null
}) {
  const safe = Array.isArray(results) ? results : []
  const [selected, setSelected] = useState<RulesResult | null>(safe[0] ?? null)

  if (safe.length === 0) {
    return <div className="text-center py-20 text-slate-500 text-sm">No rules data available.</div>
  }

  return (
    <div className="space-y-6">
      {/* Session + Killzone */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Session:</span>
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
            {session.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        {killzone && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Killzone:</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              🎯 {killzone}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: pair list */}
        <div className="space-y-2">
          {safe.map((r) => (
            <button
              key={r.pair}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.pair === r.pair
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{r.pair}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeColor[r.rulesResult.grade]}`}>
                    {r.rulesResult.grade}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${recColor[r.rulesResult.recommendation]}`}>
                    {r.rulesResult.recommendation}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                <span>Score: <b className="text-white">{r.rulesResult.totalScore}/{r.rulesResult.maxScore}</b></span>
                <span>Rules: <b className="text-white">{r.rulesResult.passedRules}/{r.rulesResult.results.length}</b></span>
              </div>
              {/* Score bar */}
              <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${r.rulesResult.grade === 'A' ? 'bg-emerald-500' :
                      r.rulesResult.grade === 'B' ? 'bg-blue-500' :
                        r.rulesResult.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  style={{ width: ((r.rulesResult.totalScore / r.rulesResult.maxScore) * 100) + '%' }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right: detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{selected.pair}</h2>
                <p className="text-slate-400 text-xs">
                  {selected.direction.toUpperCase()} · Score {selected.rulesResult.totalScore}/{selected.rulesResult.maxScore}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${gradeColor[selected.rulesResult.grade]}`}>
                  {selected.rulesResult.grade}
                </span>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${recColor[selected.rulesResult.recommendation]}`}>
                  {selected.rulesResult.recommendation}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Score', value: selected.rulesResult.totalScore + '/' + selected.rulesResult.maxScore },
                { label: 'Rules Passed', value: selected.rulesResult.passedRules + '/' + selected.rulesResult.results.length },
                { label: 'Rules Failed', value: selected.rulesResult.failedRules.toString() },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
              <p className="text-[10px] text-violet-400 font-mono">{selected.rulesResult.summary}</p>
            </div>

            {/* Rules list */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">📋 Rule Results</p>
              {selected.rulesResult.results.map((rule, i) => (
                <RuleRow key={i} rule={rule} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}