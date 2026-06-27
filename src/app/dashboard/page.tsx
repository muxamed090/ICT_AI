import React from "react"
import { redirect } from "next/navigation"
import { Plus, Star, Calendar } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { ProfileRepository } from "@/lib/repositories/ProfileRepository"
import { SettingsRepository } from "@/lib/repositories/SettingsRepository"
import { WatchlistRepository } from "@/lib/repositories/WatchlistRepository"
import { TradeJournalRepository } from "@/lib/repositories/TradeJournalRepository"
import { SignalRepository } from "@/lib/repositories/SignalRepository"
import { AiAnalysisRepository } from "@/lib/repositories/AiAnalysisRepository"
import { EconomicEventsRepository } from "@/lib/repositories/EconomicEventsRepository"

import PageTitle from "@/components/widgets/PageTitle"
import StatCard from "@/components/widgets/StatCard"
import InfoCard from "@/components/widgets/InfoCard"
import ActivityCard from "@/components/widgets/ActivityCard"
import SectionHeader from "@/components/widgets/SectionHeader"
import ConsoleControls from "@/components/dashboard/ConsoleControls"
import { EmptyState } from "@/components/dashboard/LoadingStates"
import { Profile, UserSettings } from "@/types/database"
import { computeJournalStats } from "@/lib/services/JournalStatsService"
import { MarketDataProvider } from "@/lib/market/MarketDataProvider"
import SessionCard from "@/components/widgets/SessionCard"
import MarketMiniTicker from "@/components/widgets/MarketMiniTicker"
import TradingStatusCard from "@/components/news/TradingStatusCard"
import NewsCountdown from "@/components/news/NewsCountdown"

export const dynamic = "force-dynamic"

export default async function DashboardHome() {
  const supabase = await createClient()

  // 1. Get active session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 2. Instantiate Repositories
  const profileRepo = new ProfileRepository(supabase)
  const settingsRepo = new SettingsRepository(supabase)
  const watchlistRepo = new WatchlistRepository(supabase)
  const journalRepo = new TradeJournalRepository(supabase)
  const signalRepo = new SignalRepository(supabase)
  const aiRepo = new AiAnalysisRepository(supabase)
  const economicRepo = new EconomicEventsRepository(supabase)

  // 3. Fetch Data defensively
  let profile: Profile
  try {
    const fetchedProfile = await profileRepo.getById(user.id)
    if (fetchedProfile) {
      profile = fetchedProfile
    } else {
      profile = await profileRepo.create({
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Trader",
        avatar_url: null,
        timezone: "UTC",
        language: "en"
      })
    }
  } catch (err) {
    console.error("Defensive profile retrieval error:", err)
    profile = {
      id: user.id,
      email: user.email ?? "",
      full_name: "Demo Trader",
      avatar_url: null,
      timezone: "UTC",
      language: "en",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  let settings: UserSettings
  try {
    const fetchedSettings = await settingsRepo.getById(user.id)
    if (fetchedSettings) {
      settings = fetchedSettings
    } else {
      settings = await settingsRepo.create({
        id: user.id,
        theme: "dark",
        timezone: "UTC",
        language: "en",
        notification_enabled: true,
        telegram_enabled: false,
        telegram_chat_id: null,
        risk_percent: 1.00,
        ai_learning_enabled: true,
        ml_mode: "rules_only",
        signal_threshold: 7.00,
        max_spread_allowed: 3.00,
        daily_drawdown_limit: 5.00,
        news_buffer_minutes: 30,
        risk_profile: 'balanced',
        ml_confidence_weight: 0.30,
        ml_min_training_samples: 10,
        ml_auto_retrain: true,
      })
    }
  } catch (err) {
    console.error("Defensive settings retrieval error:", err)
    settings = {
      id: user.id,
      theme: "dark",
      timezone: "UTC",
      language: "en",
      notification_enabled: true,
      telegram_enabled: false,
      telegram_chat_id: null,
      risk_percent: 1.00,
      ai_learning_enabled: true,
      ml_mode: "rules_only",
      signal_threshold: 7.00,
      max_spread_allowed: 3.00,
      daily_drawdown_limit: 5.00,
      news_buffer_minutes: 30,
      risk_profile: 'balanced',
      ml_confidence_weight: 0.30,
      ml_min_training_samples: 10,
      ml_auto_retrain: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const watchlist = await watchlistRepo.getAll(user.id)
  const trades = await journalRepo.getAll(user.id)
  const signals = await signalRepo.getAll(user.id)
  const economicEvents = await economicRepo.getAll()
  const aiAnalysis = await aiRepo.getAll(user.id)

  // 4. Calculate Winning Metrics & Performance (via stats service)
  const journalStats = computeJournalStats(trades)
  const balance = 50000 + journalStats.netPnl
  const activePositions = trades.filter(t => t.result === "pending")

  // Calculate Today's metrics
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayTrades = trades.filter(t => new Date(t.created_at) >= todayStart)
  const todayPnl = todayTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0)
  const todayCount = todayTrades.length

  // 5. Format Info Cards Data
  const accountDetails = [
    { label: "Account Email", value: profile.email || "No email", highlight: false },
    { label: "Risk Percent Limit", value: `${Number(settings.risk_percent).toFixed(2)}%`, highlight: true },
    { label: "Account Timezone", value: settings.timezone, highlight: false },
    { label: "Telegram Alerts", value: settings.telegram_enabled ? "ENABLED" : "DISABLED", highlight: settings.telegram_enabled },
  ]

  const journalSummary = [
    { label: "Total Trades Today", value: todayCount.toString(), highlight: false },
    { label: "Winning Rate", value: `${journalStats.winRate.toFixed(1)}%`, highlight: true },
    { label: "Profit Factor", value: journalStats.profitFactor.toFixed(2), highlight: false },
    { label: "Net PnL Today", value: `${todayPnl >= 0 ? "+" : "-"}$${Math.abs(todayPnl).toFixed(2)}`, highlight: true },
  ]

  // 6. Format Signal Activity Items
  const signalItems = signals.map(sig => {
    const diffMs = Date.now() - new Date(sig.created_at).getTime()
    const diffMins = Math.max(1, Math.floor(diffMs / 60000))
    const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`
    
    let badgeColor: "green" | "blue" | "purple" | "red" | "neutral" = "neutral"
    if (sig.pair.includes("GBP")) badgeColor = "green"
    else if (sig.pair.includes("EUR")) badgeColor = "blue"
    else if (sig.pair.includes("XAU")) badgeColor = "purple"
    else if (sig.pair.includes("USD")) badgeColor = "red"

    return {
      id: sig.id,
      title: `${sig.pair} ${sig.direction.toUpperCase()} Signal`,
      subtitle: `Score: ${Number(sig.score).toFixed(1)} | Conf: ${Number(sig.confidence).toFixed(1)}% | Entry: ${Number(sig.entry).toFixed(5)}`,
      time: timeStr,
      badgeText: sig.pair,
      badgeColor
    }
  })

  // 7. Get Latest AI Structure Analysis Details
  const latestAnalysis = aiAnalysis[0]
  let marketShiftVal = "Neutral"
  let marketShiftChange = "No shifts detected"
  let marketShiftTrend: "up" | "down" | "neutral" = "neutral"
  let marketShiftSub = "All models standby"

  if (latestAnalysis) {
    marketShiftVal = `${latestAnalysis.market_bias.toUpperCase()} MSS`
    marketShiftChange = `${latestAnalysis.pair} (${Number(latestAnalysis.confidence).toFixed(1)}% Conf)`
    marketShiftTrend = latestAnalysis.market_bias === "bullish" ? "up" : latestAnalysis.market_bias === "bearish" ? "down" : "neutral"
    marketShiftSub = `Confluence: ${Number(latestAnalysis.confluence_score).toFixed(1)} | Session: ${latestAnalysis.session.toUpperCase()}`
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Intelligence Dashboard" 
          subtitle="AI-driven market structure shift monitoring and liquidity sweeps workspace."
        />
      </div>

      {/* Phase 6: Live Market Ticker Bar */}
      <MarketDataProvider>
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-3 space-y-2">
          <div className="flex items-center gap-2 justify-between">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Market Feed</p>
            <div className="flex items-center gap-3">
              <TradingStatusCard events={economicEvents} />
              <NewsCountdown events={economicEvents} />
            </div>
          </div>
          <MarketMiniTicker />
        </div>
      </MarketDataProvider>

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Account Equity Balance"
          value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${todayPnl >= 0 ? "+" : "-"}$${Math.abs(todayPnl).toFixed(2)} today`}
          trend={todayPnl >= 0 ? "up" : "down"}
          subtitle={`Equity: $${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          glow={true}
        />
        <StatCard
          title="Market Shift Status"
          value={marketShiftVal}
          change={marketShiftChange}
          trend={marketShiftTrend}
          subtitle={marketShiftSub}
        />
        <StatCard
          title="AI Processing Engine"
          value={settings.ai_learning_enabled ? "ONLINE" : "STANDBY"}
          change={settings.ai_learning_enabled ? "12ms latency" : "PAUSED"}
          trend={settings.ai_learning_enabled ? "up" : "neutral"}
          subtitle={`Model ID: ${latestAnalysis?.model_version || "ICT-Net v2.4r"}`}
        />
      </div>

      {/* Main Grid content split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Positions & Signals */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Open Positions Card */}
          <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
            <SectionHeader 
              title="Active Positions" 
              description="Real-time monitoring of open market exposures"
              action={
                <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase transition-colors cursor-pointer bg-transparent border-0 outline-none">
                  New Order <Plus className="h-3 w-3" />
                </button>
              }
            />
            
            {activePositions.length === 0 ? (
              <EmptyState 
                title="No Active Positions"
                description="No open market exposures found. Run a scanner to detect new confluences."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Symbol</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Risk Limit</th>
                      <th className="py-2.5">Entry</th>
                      <th className="py-2.5">Current (Sim)</th>
                      <th className="py-2.5 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-slate-200">
                    {activePositions.map((pos) => {
                      const isProfit = Number(pos.pnl || 0) >= 0
                      const simulatedCurrent = pos.direction === "buy" 
                        ? Number(pos.entry) + 0.00015 
                        : Number(pos.entry) - 0.00015

                      return (
                        <tr key={pos.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-bold text-white">{pos.pair}</td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              pos.direction === "buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>{pos.direction.toUpperCase()}</span>
                          </td>
                          <td className="py-3 font-mono">{Number(settings.risk_percent).toFixed(2)}%</td>
                          <td className="py-3 font-mono text-slate-400">{Number(pos.entry).toFixed(5)}</td>
                          <td className="py-3 font-mono text-slate-300">{simulatedCurrent.toFixed(5)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          }`}>{Number(pos.pnl || 0) >= 0 ? "+" : "-"}${Math.abs(Number(pos.pnl || 0)).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Alerts signals */}
          {signalItems.length === 0 ? (
            <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
                Real-Time Detection Signals
              </p>
              <EmptyState 
                title="No Trading Signals"
                description="No recent ICT detection signals found. The AI engine is monitoring the charts."
              />
            </div>
          ) : (
            <ActivityCard 
              title="Real-Time Detection Signals" 
              items={signalItems}
            />
          )}
        </div>

        {/* Right Column: Account Specs, News & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Console Panel */}
          <ConsoleControls initialSettings={settings} />

          {/* Session & Market Status */}
          <SessionCard />

          {/* Account status */}
          <InfoCard 
            title="System Account Settings" 
            items={accountDetails}
          />

          {/* Trading Journal details */}
          <InfoCard
            title="Trading Journal Summary"
            items={journalSummary}
          />

          {/* Active Watchlist Pairs */}
          <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
              AI Monitored Watchlist
            </p>
            {watchlist.length === 0 ? (
              <EmptyState 
                title="Watchlist Empty"
                description="No currency pairs added to your watchlist. Check settings to enable pairs."
              />
            ) : (
              <div className="space-y-2 text-xs">
                {watchlist.map((wl) => (
                  <div key={wl.id} className="flex justify-between items-center border-b border-white/[0.02] pb-1.5 last:border-0 last:pb-0">
                    <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Star className={`h-3 w-3 ${wl.favorite ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                      {wl.pair}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      wl.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-400"
                    }`}>
                      {wl.enabled ? "MONITORING" : "DISABLED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Economic Calendar Events */}
          <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-slate-950/20">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-4">
              Economic Calendar Bulletins
            </p>
            {economicEvents.length === 0 ? (
              <EmptyState 
                title="No Events Scheduled"
                description="No scheduled economic news found for this session."
              />
            ) : (
              <div className="space-y-3.5 text-xs">
                {economicEvents.map((event) => {
                  const isHigh = event.impact === "high"
                  const isMedium = event.impact === "medium"
                  const impactColor = isHigh 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : isMedium 
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"

                  const eventTime = new Date(event.event_time)
                  const timeFormatted = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div key={event.id} className="space-y-1.5 border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-bold ${impactColor}`}>
                          {event.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono font-medium">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {timeFormatted} ({event.currency})
                        </span>
                      </div>
                      <h4 className="font-semibold text-white leading-snug">
                        {event.event_name}
                      </h4>
                      {(event.forecast || event.previous || event.actual) && (
                        <div className="flex gap-3 text-[9px] font-mono text-slate-400 pt-0.5">
                          {event.forecast && <span>FCST: <span className="text-slate-300 font-semibold">{event.forecast}</span></span>}
                          {event.previous && <span>PREV: <span className="text-slate-300 font-semibold">{event.previous}</span></span>}
                          {event.actual && <span>ACT: <span className="text-emerald-400 font-semibold">{event.actual}</span></span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
