'use client'

import React, { useState, useTransition } from 'react'
import {
  Radio, AlertTriangle, Shield, Settings2, PauseCircle, PlayCircle,
  Plus, Trash2, CheckCircle2, XCircle, Activity, Clock, TrendingUp,
  Loader2, Zap
} from 'lucide-react'
import {
  UserSettings, BrokerAccount, BrokerOrder, BrokerPosition, BrokerLog,
  DecisionPlatformMode, ExecutionPlatformMode, TradingEnvironment,
} from '@/types/database'
import {
  createBrokerAccountAction,
  setActiveBrokerAccountAction,
  deleteBrokerAccountAction,
  updateTradingModeAction,
  toggleGlobalPauseAction,
  triggerEmergencyStopAction,
  clearEmergencyStopAction,
} from '@/actions/liveTradingActions'

interface LiveTradingConsoleProps {
  settings: UserSettings
  accounts: BrokerAccount[]
  activeAccount: BrokerAccount | null
  recentOrders: BrokerOrder[]
  openPositions: BrokerPosition[]
  recentLogs: BrokerLog[]
}

type TabKey = 'overview' | 'accounts' | 'positions' | 'orders' | 'logs'

const ENV_LABELS: Record<TradingEnvironment, { label: string; color: string }> = {
  paper_trading: { label: 'Paper Trading', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  demo_broker: { label: 'Demo Broker', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  live_broker: { label: 'Live Broker', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

const DECISION_LABELS: Record<DecisionPlatformMode, string> = {
  rules_only: 'Rules Only',
  hybrid: 'Hybrid',
  ml_priority: 'ML Priority',
}

const EXECUTION_LABELS: Record<ExecutionPlatformMode, string> = {
  manual: 'Manual',
  confirmation_required: 'Confirmation Required',
  fully_automatic: 'Fully Automatic',
}

export default function LiveTradingConsole({
  settings,
  accounts,
  activeAccount,
  recentOrders,
  openPositions,
  recentLogs,
}: LiveTradingConsoleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [isPending, startTransition] = useTransition()
  const [showAddAccount, setShowAddAccount] = useState(false)

  // Form state for adding broker account
  const [newAccount, setNewAccount] = useState({
    broker_type: 'mt4' as const,
    account_name: '',
    account_number: '',
    server_or_environment: '',
    api_key: '',
    api_secret: '',
    is_demo: true,
  })

  const handleGlobalPause = () => {
    startTransition(async () => {
      await toggleGlobalPauseAction(!settings.global_paused)
    })
  }

  const handleEmergencyStop = () => {
    if (!confirm('EMERGENCY STOP will halt ALL trading immediately. Confirm?')) return
    startTransition(async () => {
      await triggerEmergencyStopAction()
    })
  }

  const handleClearEmergency = () => {
    startTransition(async () => {
      await clearEmergencyStopAction()
    })
  }

  const handleAddAccount = () => {
    startTransition(async () => {
      const result = await createBrokerAccountAction({
        broker_type: newAccount.broker_type,
        account_name: newAccount.account_name,
        account_number: newAccount.account_number,
        server_or_environment: newAccount.server_or_environment,
        credentials: {
          api_key: newAccount.api_key,
          api_secret: newAccount.api_secret,
        },
        is_demo: newAccount.is_demo,
      })
      if (result.success) setShowAddAccount(false)
    })
  }

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      await setActiveBrokerAccountAction(id)
    })
  }

  const handleDeleteAccount = (id: string) => {
    if (!confirm('Remove this broker account?')) return
    startTransition(async () => {
      await deleteBrokerAccountAction(id)
    })
  }

  const handleUpdateMode = (
    decision: DecisionPlatformMode,
    execution: ExecutionPlatformMode,
    env: TradingEnvironment
  ) => {
    startTransition(async () => {
      await updateTradingModeAction(decision, execution, env)
    })
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'accounts', label: `Accounts (${accounts.length})` },
    { key: 'positions', label: `Positions (${openPositions.length})` },
    { key: 'orders', label: `Orders (${recentOrders.length})` },
    { key: 'logs', label: 'Logs' },
  ]

  const envInfo = ENV_LABELS[settings.trading_environment]

  return (
    <div className="space-y-5">

      {/* ── Emergency Banner ─────────────────────────────────────── */}
      {settings.emergency_stop && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-300">Emergency Stop Active</p>
              <p className="text-xs text-rose-400/80">All automated trading has been halted.</p>
            </div>
          </div>
          <button
            onClick={handleClearEmergency}
            disabled={isPending}
            className="shrink-0 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold px-4 py-2 border border-rose-500/30 transition-colors"
          >
            Clear Emergency Stop
          </button>
        </div>
      )}

      {/* ── Status Cards Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Environment */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Environment</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${envInfo.color}`}>
            {envInfo.label}
          </span>
        </div>
        {/* Decision Mode */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Decision Mode</p>
          <p className="text-sm font-bold text-white">{DECISION_LABELS[settings.decision_mode]}</p>
        </div>
        {/* Execution Mode */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Execution Mode</p>
          <p className="text-sm font-bold text-white">{EXECUTION_LABELS[settings.execution_mode]}</p>
        </div>
        {/* Open Positions */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Open Positions</p>
          <p className="text-2xl font-bold text-white">{openPositions.length}</p>
        </div>
      </div>

      {/* ── Quick Controls ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0B1220] px-5 py-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Controls</span>

        <button
          onClick={handleGlobalPause}
          disabled={isPending}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold border transition-all ${
            settings.global_paused
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          {settings.global_paused
            ? <><PlayCircle className="h-3.5 w-3.5" /> Resume Trading</>
            : <><PauseCircle className="h-3.5 w-3.5" /> Pause Trading</>
          }
        </button>

        {!settings.emergency_stop && (
          <button
            onClick={handleEmergencyStop}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
          >
            <Shield className="h-3.5 w-3.5" />
            Emergency Stop
          </button>
        )}

        {isPending && (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.06] gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Mode Configuration */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-white">Trading Mode Configuration</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Trading Environment
                </label>
                <div className="flex gap-2">
                  {(['paper_trading', 'demo_broker', 'live_broker'] as TradingEnvironment[]).map((env) => (
                    <button
                      key={env}
                      onClick={() => handleUpdateMode(settings.decision_mode, settings.execution_mode, env)}
                      disabled={isPending}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold border transition-all ${
                        settings.trading_environment === env
                          ? ENV_LABELS[env].color + ' border-current'
                          : 'border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {ENV_LABELS[env].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Decision Mode
                </label>
                <div className="flex gap-2">
                  {(['rules_only', 'hybrid', 'ml_priority'] as DecisionPlatformMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleUpdateMode(mode, settings.execution_mode, settings.trading_environment)}
                      disabled={isPending}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold border transition-all ${
                        settings.decision_mode === mode
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {DECISION_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Execution Mode
                </label>
                <div className="flex gap-2">
                  {(['manual', 'confirmation_required', 'fully_automatic'] as ExecutionPlatformMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleUpdateMode(settings.decision_mode, mode, settings.trading_environment)}
                      disabled={isPending || settings.execution_mode === 'fully_automatic' && mode === 'fully_automatic' && settings.trading_environment === 'live_broker'}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold border transition-all ${
                        settings.execution_mode === mode
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                          : 'border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {EXECUTION_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No activity logs yet</p>
              ) : (
                recentLogs.slice(0, 12).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 py-1.5 border-b border-white/[0.03] last:border-0">
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      log.log_level === 'error' || log.log_level === 'circuit_breaker'
                        ? 'bg-rose-500'
                        : log.log_level === 'warn'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-300 leading-snug truncate">{log.message}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Manage your broker connections. Credentials are AES-256 encrypted.</p>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Account
            </button>
          </div>

          {showAddAccount && (
            <div className="rounded-xl border border-white/[0.08] bg-[#0B1220] p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Add Broker Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Broker Type</label>
                  <select
                    value={newAccount.broker_type}
                    onChange={(e) => setNewAccount(p => ({ ...p, broker_type: e.target.value as typeof newAccount.broker_type }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                  >
                    <option value="mt4">MetaTrader 4</option>
                    <option value="mt5">MetaTrader 5</option>
                    <option value="ctrader">cTrader</option>
                    <option value="binance">Binance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Account Name</label>
                  <input
                    value={newAccount.account_name}
                    onChange={(e) => setNewAccount(p => ({ ...p, account_name: e.target.value }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                    placeholder="e.g. My MT5 Main"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Account Number</label>
                  <input
                    value={newAccount.account_number}
                    onChange={(e) => setNewAccount(p => ({ ...p, account_number: e.target.value }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                    placeholder="e.g. 12345678"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Server / Environment</label>
                  <input
                    value={newAccount.server_or_environment}
                    onChange={(e) => setNewAccount(p => ({ ...p, server_or_environment: e.target.value }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                    placeholder="e.g. ICMarkets-Demo01"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">API Key</label>
                  <input
                    type="password"
                    value={newAccount.api_key}
                    onChange={(e) => setNewAccount(p => ({ ...p, api_key: e.target.value }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">API Secret</label>
                  <input
                    type="password"
                    value={newAccount.api_secret}
                    onChange={(e) => setNewAccount(p => ({ ...p, api_secret: e.target.value }))}
                    className="w-full rounded-lg bg-[#050911] border border-white/[0.06] text-white text-xs px-3 py-2 focus:border-blue-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={newAccount.is_demo}
                    onChange={(e) => setNewAccount(p => ({ ...p, is_demo: e.target.checked }))}
                    className="rounded"
                  />
                  Demo Account
                </label>
                <button
                  onClick={handleAddAccount}
                  disabled={isPending || !newAccount.account_name || !newAccount.account_number}
                  className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 transition-colors"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Save Account
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-8 text-center">
                <Radio className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No broker accounts connected</p>
                <p className="text-xs text-slate-600 mt-1">Add a broker account to start live/demo trading.</p>
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                    acc.is_active
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-white/[0.06] bg-[#0B1220]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      acc.connection_status === 'connected' ? 'bg-emerald-500' :
                      acc.connection_status === 'error' ? 'bg-rose-500' : 'bg-slate-600'
                    }`} />
                    <div>
                      <p className="text-sm font-bold text-white">{acc.account_name}</p>
                      <p className="text-[10px] text-slate-500">{acc.broker_type.toUpperCase()} · {acc.account_number} · {acc.is_demo ? 'Demo' : 'Live'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {acc.is_active && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">ACTIVE</span>
                    )}
                    {!acc.is_active && (
                      <button
                        onClick={() => handleSetActive(acc.id)}
                        disabled={isPending}
                        className="text-[10px] font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.15] transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      disabled={isPending}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-8 text-center">
              <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No open positions</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#0A1019]">
                    {['Ticket', 'Pair', 'Direction', 'Lots', 'Open Price', 'SL', 'TP', 'Unrealized P&L', 'Environment'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-widest text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map((pos) => (
                    <tr key={pos.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">{pos.broker_ticket}</td>
                      <td className="px-4 py-3 font-bold text-white">{pos.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${pos.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{pos.lot_size.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">{pos.open_price.toFixed(5)}</td>
                      <td className="px-4 py-3 text-rose-400">{pos.stop_loss.toFixed(5)}</td>
                      <td className="px-4 py-3 text-emerald-400">{pos.take_profit.toFixed(5)}</td>
                      <td className="px-4 py-3">
                        <span className={pos.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {pos.unrealized_pnl >= 0 ? '+' : ''}{pos.unrealized_pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ENV_LABELS[pos.trading_environment].color}`}>
                          {ENV_LABELS[pos.trading_environment].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] p-8 text-center">
              <Zap className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#0A1019]">
                    {['Status', 'Pair', 'Dir', 'Lots', 'Req. Price', 'Exec. Price', 'SL', 'TP', 'Latency', 'Time'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-widest text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        {order.status === 'filled'
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          : order.status === 'rejected'
                            ? <XCircle className="h-3.5 w-3.5 text-rose-400" />
                            : <Clock className="h-3.5 w-3.5 text-amber-400" />
                        }
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{order.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${order.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {order.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{order.lot_size.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400">{order.requested_price.toFixed(5)}</td>
                      <td className="px-4 py-3 text-slate-300">{order.executed_price?.toFixed(5) ?? '—'}</td>
                      <td className="px-4 py-3 text-rose-400">{order.stop_loss.toFixed(5)}</td>
                      <td className="px-4 py-3 text-emerald-400">{order.take_profit.toFixed(5)}</td>
                      <td className="px-4 py-3 text-slate-500">{order.execution_latency_ms != null ? `${order.execution_latency_ms}ms` : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(order.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0B1220] overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No logs yet</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors last:border-0">
                  <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    log.log_level === 'error' || log.log_level === 'circuit_breaker'
                      ? 'bg-rose-500/10 text-rose-400'
                      : log.log_level === 'warn'
                        ? 'bg-amber-500/10 text-amber-400'
                        : log.log_level === 'security'
                          ? 'bg-violet-500/10 text-violet-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                  }`}>{log.log_level}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-300 leading-snug">{log.message}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">{log.category} · {new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeAccount && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0B1220]/50 px-5 py-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-slate-500">
            Active account: <span className="text-white font-semibold">{activeAccount.account_name}</span>
            {' '}·{' '}{activeAccount.broker_type.toUpperCase()}
            {' '}·{' '}{activeAccount.is_demo ? 'Demo' : 'Live'}
          </p>
        </div>
      )}
    </div>
  )
}
