'use client'

import React, { useState } from 'react'
import { JournalEntry, JournalStats, SessionStats, PairStats, AIReview } from '@/lib/journal/types'

const resultColor: Record<string, string> = {
  win: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  loss: 'text-rose-400   bg-rose-500/10    border-rose-500/20',
  breakeven: 'text-amber-400  bg-amber-500/10   border-amber-500/20',
  pending: 'text-slate-400  bg-slate-500/10   border-slate-500/20',
}

interface JournalData {
  trades: JournalEntry[]
  stats: JournalStats
  sessionStats: SessionStats[]
  pairStats: PairStats[]
}

export default function JournalPanel({ initialData }: { initialData: JournalData }) {
  const [data, setData] = useState<JournalData>(initialData)
  const [tab, setTab] = useState<'trades' | 'stats' | 'add'>('trades')
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [review, setReview] = useState<AIReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    pair: 'EURUSD', direction: 'buy', timeframe: 'H1',
    session: 'london', killzone: '', setup_type: 'BOS+FVG',
    entry: '', stop_loss: '', take_profit: '', risk_reward: '',
    result: 'pending', pnl: '', notes: '',
  })

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/journal')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    setLoading(true)
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          entry: parseFloat(form.entry),
          stop_loss: parseFloat(form.stop_loss),
          take_profit: parseFloat(form.take_profit),
          risk_reward: parseFloat(form.risk_reward),
          pnl: parseFloat(form.pnl || '0'),
        }),
      })
      await refresh()
      setTab('trades')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    await refresh()
    setSelected(null)
  }
  const [closeForm, setCloseForm] = useState<{ result: string; pnl: string; exitPrice: string } | null>(null)

  async function handleCloseTrade(id: string, result: string, pnl: number) {
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        id,
        updates: { result, pnl },
      }),
    })
    await refresh()
    setCloseForm(null)
  }
  async function handleReview(id: string) {
    setReviewLoading(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review', id }),
      })
      const json = await res.json()
      setReview(json.review)
    } finally {
      setReviewLoading(false)
    }
  }

  const { trades, stats, sessionStats, pairStats } = data

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Trades', value: stats.totalTrades.toString() },
          { label: 'Win Rate', value: stats.winRate + '%' },
          { label: 'Total P&L', value: (stats.totalPnl >= 0 ? '+' : '') + '$' + stats.totalPnl.toFixed(2) },
          { label: 'Profit Factor', value: stats.profitFactor.toString() },
          { label: 'Avg R:R', value: stats.avgRR.toString() },
          { label: 'Wins / Losses', value: stats.wins + ' / ' + stats.losses },
          { label: 'Max Cons. Wins', value: stats.maxConsecutiveWins.toString() },
          { label: 'Max Cons. Loss', value: stats.maxConsecutiveLosses.toString() },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-bold mt-1 text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['trades', 'stats', 'add'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${tab === t
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-white/[0.02] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]'
              }`}
          >
            {t === 'trades' ? '📋 Trades' : t === 'stats' ? '📊 Statistics' : '➕ Add Trade'}
          </button>
        ))}
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition ml-auto disabled:opacity-50"
        >
          {loading ? '⏳' : '↻ Refresh'}
        </button>
      </div>

      {/* Trades Tab */}
      {tab === 'trades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade list */}
          <div className="space-y-2">
            {trades.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">No trades logged yet.</p>
            ) : trades.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setReview(null) }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected?.id === t.id
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{t.pair}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${resultColor[t.result]}`}>
                    {t.result.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  <span className={t.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                    {t.direction.toUpperCase()}
                  </span>
                  <span>{t.session}</span>
                  <span>{t.setup_type}</span>
                </div>
                <div className="flex gap-3 mt-0.5 text-[10px]">
                  <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </span>
                  <span className="text-slate-500">R:R {t.risk_reward}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Trade detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">{selected.pair}</h2>
                  <p className="text-slate-400 text-xs">
                    {selected.direction.toUpperCase()} · {selected.session} · {selected.setup_type}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(selected.id!)}
                    disabled={reviewLoading}
                    className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold transition hover:bg-violet-500/20 disabled:opacity-50"
                  >
                    {reviewLoading ? '⏳' : '🤖 AI Review'}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id!)}
                    className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold transition hover:bg-rose-500/20"
                  >
                    🗑 Delete
                  </button>
                </div>
                {selected.result === 'pending' && (
                  <button
                    onClick={() => setCloseForm({ result: 'win', pnl: '', exitPrice: '' })}
                    className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold transition hover:bg-amber-500/20"
                  >
                    🔒 Close Trade
                  </button>
                )}
              </div>

              {/* Price levels */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Entry', value: selected.entry.toString(), cls: 'text-white' },
                  { label: 'Stop Loss', value: selected.stop_loss.toString(), cls: 'text-rose-400' },
                  { label: 'Take Profit', value: selected.take_profit.toString(), cls: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    <p className={`text-xs font-mono font-bold mt-1 ${item.cls}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Result */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Result', value: selected.result.toUpperCase() },
                  { label: 'P&L', value: (selected.pnl >= 0 ? '+' : '') + '$' + selected.pnl.toFixed(2) },
                  { label: 'R:R', value: selected.risk_reward.toString() },
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    <p className="text-xs font-bold mt-1 text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              {/* Close Trade Modal */}
              {closeForm && selected && (
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider">🔒 Close Trade</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Result</p>
                      <select
                        value={closeForm.result}
                        onChange={(e) => setCloseForm((f) => f ? { ...f, result: e.target.value } : null)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="win">WIN</option>
                        <option value="loss">LOSS</option>
                        <option value="breakeven">BREAKEVEN</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">P&L ($)</p>
                      <input
                        type="number"
                        value={closeForm.pnl}
                        onChange={(e) => setCloseForm((f) => f ? { ...f, pnl: e.target.value } : null)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        placeholder="e.g. 150"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Exit Price</p>
                      <input
                        type="number"
                        value={closeForm.exitPrice}
                        onChange={(e) => setCloseForm((f) => f ? { ...f, exitPrice: e.target.value } : null)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                        placeholder="e.g. 1.14500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCloseTrade(selected.id!, closeForm.result, parseFloat(closeForm.pnl || '0'))}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition hover:bg-emerald-500/30"
                    >
                      ✅ Confirm Close
                    </button>
                    <button
                      onClick={() => setCloseForm(null)}
                      className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 text-xs transition hover:bg-white/[0.06]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* Notes */}
              {selected.notes && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 mb-2">📝 Notes</p>
                  <p className="text-xs text-slate-300">{selected.notes}</p>
                </div>
              )}

              {/* AI Review */}
              {review && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] text-violet-400 uppercase tracking-wider">🤖 AI Review</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Entry Quality', value: review.entryQuality },
                      { label: 'Risk Mgmt', value: review.riskManagement },
                      { label: 'Confluence Score', value: review.confluenceScore + '%' },
                      { label: 'Rating', value: review.rating + '/10' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[10px] text-slate-500">{item.label}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {review.strengths.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-400 mb-1">✅ Strengths</p>
                      {review.strengths.map((s, i) => <p key={i} className="text-[10px] text-slate-300">• {s}</p>)}
                    </div>
                  )}
                  {review.weaknesses.length > 0 && (
                    <div>
                      <p className="text-[10px] text-rose-400 mb-1">⚠️ Weaknesses</p>
                      {review.weaknesses.map((w, i) => <p key={i} className="text-[10px] text-slate-300">• {w}</p>)}
                    </div>
                  )}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-amber-400 mb-1">💡 Lesson</p>
                    <p className="text-[10px] text-slate-300">{review.lesson}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {/* Session Performance */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">🕐 Session Performance</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sessionStats.map((s) => (
                <div key={s.session} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase">{s.session}</p>
                  <p className="text-lg font-bold text-white mt-1">{s.winRate}%</p>
                  <p className="text-[10px] text-slate-400">{s.wins}W / {s.trades - s.wins}L</p>
                  <p className={`text-[10px] mt-1 ${s.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(2)}
                  </p>
                  <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.winRate >= 60 ? 'bg-emerald-500' : s.winRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: s.winRate + '%' }} />
                  </div>
                </div>
              ))}
              {sessionStats.length === 0 && <p className="text-slate-500 text-xs col-span-4 text-center py-4">No data yet</p>}
            </div>
          </div>

          {/* Pair Performance */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">💱 Pair Performance</p>
            <div className="space-y-2">
              {pairStats.map((p) => (
                <div key={p.pair} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-white w-16">{p.pair}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.winRate >= 60 ? 'bg-emerald-500' : p.winRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: p.winRate + '%' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 w-12">WR: {p.winRate}%</span>
                  <span className="text-[10px] text-slate-400 w-12">RR: {p.avgRR}</span>
                  <span className={`text-[10px] font-bold w-16 text-right ${p.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.totalPnl >= 0 ? '+' : ''}${p.totalPnl.toFixed(2)}
                  </span>
                </div>
              ))}
              {pairStats.length === 0 && <p className="text-slate-500 text-xs text-center py-4">No data yet</p>}
            </div>
          </div>

          {/* Best/Worst */}
          {(stats.bestTrade || stats.worstTrade) && (
            <div className="grid grid-cols-2 gap-3">
              {stats.bestTrade && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-400 uppercase mb-2">🏆 Best Trade</p>
                  <p className="text-xs font-bold text-white">{stats.bestTrade.pair} {stats.bestTrade.direction.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">+${stats.bestTrade.pnl.toFixed(2)} | R:R {stats.bestTrade.risk_reward}</p>
                </div>
              )}
              {stats.worstTrade && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-rose-400 uppercase mb-2">📉 Worst Trade</p>
                  <p className="text-xs font-bold text-white">{stats.worstTrade.pair} {stats.worstTrade.direction.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">${stats.worstTrade.pnl.toFixed(2)} | R:R {stats.worstTrade.risk_reward}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Trade Tab */}
      {tab === 'add' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">➕ Log New Trade</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Pair', key: 'pair', type: 'select', options: ['EURUSD', 'XAUUSD', 'USDCAD', 'EURJPY'] },
              { label: 'Direction', key: 'direction', type: 'select', options: ['buy', 'sell'] },
              { label: 'Timeframe', key: 'timeframe', type: 'select', options: ['M15', 'H1', 'H4'] },
              { label: 'Session', key: 'session', type: 'select', options: ['london', 'new_york', 'asian', 'overlap'] },
              { label: 'Setup', key: 'setup_type', type: 'select', options: ['BOS+FVG', 'CHoCH+OB', 'Liquidity+FVG', 'OTE'] },
              { label: 'Result', key: 'result', type: 'select', options: ['pending', 'win', 'loss', 'breakeven'] },
            ].map((field) => (
              <div key={field.key}>
                <p className="text-[10px] text-slate-500 mb-1">{field.label}</p>
                <select
                  value={(form as Record<string, string>)[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {[
              { label: 'Entry', key: 'entry' },
              { label: 'Stop Loss', key: 'stop_loss' },
              { label: 'Take Profit', key: 'take_profit' },
              { label: 'R:R Ratio', key: 'risk_reward' },
              { label: 'P&L ($)', key: 'pnl' },
              { label: 'Killzone', key: 'killzone' },
            ].map((field) => (
              <div key={field.key}>
                <p className="text-[10px] text-slate-500 mb-1">{field.label}</p>
                <input
                  type="text"
                  value={(form as Record<string, string>)[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Notes</p>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white resize-none"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-bold transition disabled:opacity-50"
          >
            {loading ? '⏳ Saving...' : '💾 Save Trade'}
          </button>
        </div>
      )}
    </div>
  )
}