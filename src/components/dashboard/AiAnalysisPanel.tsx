"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AiAnalysis } from '@/types/database'
import SearchBar from '@/components/common/SearchBar'
import FilterDropdown from '@/components/common/FilterDropdown'

const BIAS_OPTIONS = [
  { value: 'all', label: 'All Bias' },
  { value: 'bullish', label: 'Bullish' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'neutral', label: 'Neutral' },
]

const KZ_OPTIONS = [
  { value: 'all', label: 'All Killzones' },
  { value: 'asia', label: 'Asia' },
  { value: 'london', label: 'London' },
  { value: 'new_york', label: 'New York' },
  { value: 'none', label: 'None' },
]

const biasBadge: Record<string, string> = {
  bullish: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  bearish: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

interface AiAnalysisPanelProps {
  analyses: AiAnalysis[]
}

function StructureIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
      active
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-white/[0.02] text-slate-600 border-white/[0.04]'
    }`}>
      {label} {active ? '✓' : '✗'}
    </span>
  )
}

export default function AiAnalysisPanel({ analyses }: AiAnalysisPanelProps) {
  const [search, setSearch] = useState('')
  const [biasFilter, setBiasFilter] = useState('all')
  const [kzFilter, setKzFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = analyses
    .filter((a) => a.pair.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => biasFilter === 'all' || a.market_bias === biasFilter)
    .filter((a) => kzFilter === 'all' || a.killzone === kzFilter)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search pair…" className="flex-1 min-w-[160px]" />
        <FilterDropdown label="Bias" options={BIAS_OPTIONS} value={biasFilter} onChange={setBiasFilter} />
        <FilterDropdown label="Killzone" options={KZ_OPTIONS} value={kzFilter} onChange={setKzFilter} />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          {analyses.length === 0 ? 'No AI analyses yet. The engine will populate this once active.' : 'No analyses match your filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((a) => {
            const badge = biasBadge[a.market_bias] ?? biasBadge.neutral
            const isExpanded = expandedId === a.id

            return (
              <div key={a.id} className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{a.pair}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{a.timeframe}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${badge}`}>
                    {a.market_bias}
                  </span>
                </div>

                {/* ICT Structure */}
                <div className="flex flex-wrap gap-1">
                  <StructureIndicator label="BOS" active={a.bos} />
                  <StructureIndicator label="CHoCH" active={a.choch} />
                  <StructureIndicator label="OB" active={a.order_block_mitigated} />
                  <StructureIndicator label="OTE" active={a.ote_zone_detected} />
                  <StructureIndicator label="Liq↑" active={a.liquidity_sweep_high} />
                  <StructureIndicator label="Liq↓" active={a.liquidity_sweep_low} />
                  <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    a.fvg_type !== 'none'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-white/[0.02] text-slate-600 border-white/[0.04]'
                  }`}>
                    FVG {a.fvg_type.toUpperCase()}
                  </span>
                </div>

                {/* Scores */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500 font-bold uppercase">Confluence</span>
                    <span className="text-white font-mono font-bold">{Number(a.confluence_score).toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, Number(a.confluence_score))}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500 font-bold uppercase">Confidence</span>
                    <span className="text-white font-mono font-bold">{Number(a.confidence).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, Number(a.confidence))}%` }} />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="text-slate-500">Session: <span className="text-slate-300 font-semibold">{a.session.replace(/_/g, ' ')}</span></span>
                  <span className="text-slate-500">KZ: <span className="text-slate-300 font-semibold">{a.killzone}</span></span>
                  <span className="text-slate-600 ml-auto font-mono">{a.model_version}</span>
                </div>

                {/* Expandable explanation */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                >
                  {isExpanded ? 'Hide' : 'Show'} Explanation
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="text-[10px] text-slate-400 leading-relaxed bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    {a.explanation}
                  </div>
                )}

                {/* Footer */}
                <div className="text-[9px] text-slate-600 font-mono text-right">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[9px] text-slate-600 font-mono">{analyses.length} analys{analyses.length !== 1 ? 'es' : 'is'} total</p>
    </div>
  )
}
