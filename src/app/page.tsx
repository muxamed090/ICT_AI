"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { 
  TrendingUp, 
  ChevronRight, 
  Cpu, 
  BarChart3, 
  Layers, 
  Zap,
  Lock,
  TrendingDown
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()

  const handleCTA = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-blue-500" />,
      title: "AI Market Structure Shift",
      description: "Proprietary deep learning model maps Swing Highs & Lows to identify structural trend changes with zero lag."
    },
    {
      icon: <Layers className="h-6 w-6 text-blue-500" />,
      title: "Order Block Detection",
      description: "Instantly tracks institutional buying and selling zones, separating mitigated blocks from fresh liquidity."
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      title: "Fair Value Gaps (FVG)",
      description: "Auto-maps imbalance inefficiencies and computes the historical probability of price filling the gap."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
      title: "Liquidity Sweeps & Pools",
      description: "Detects stop hunts above buy-side and below sell-side liquidity pools in major FX pairs and indices."
    }
  ]

  const sampleSignals = [
    { pair: "EURUSD", type: "Bullish MSS", time: "2 min ago", price: "1.08450", status: "Active", strength: "High" },
    { pair: "GBPUSD", type: "Liquidity Sweep", time: "12 min ago", price: "1.26820", status: "Mitigated", strength: "Medium" },
    { pair: "BTCUSD", type: "FVG Creation", time: "25 min ago", price: "64,250", status: "Active", strength: "High" },
  ]

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      {/* Main Hero Container */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 lg:pt-24 lg:pb-32">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Phase 1 Live &bull; Alpha Release
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-5xl xl:text-6xl leading-[1.1] md:leading-[1.15]">
              Institutional <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">ICT Analysis</span> Powered by AI
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Automate your Inner Circle Trader strategy. ICT AI Trader v2.0 reads real-time order books, monitors market structure shifts, and flags premium order blocks with machine learning precision.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={handleCTA}
                className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-all duration-200 cursor-pointer shadow-blue-500/20"
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center rounded-lg border border-white/10 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                Explore Features
              </a>
            </div>

            {/* Stats / Proof */}
            <div className="pt-6 border-t border-white/[0.05] grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-bold text-white">99.4%</p>
                <p className="text-xs text-slate-400">Detection Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">&lt; 50ms</p>
                <p className="text-xs text-slate-400">Signal Latency</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-slate-400">Market Coverage</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Platform Mockup */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
            {/* Ambient Backlight */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl -z-10"></div>
            
            {/* Terminal Container */}
            <div className="glass-panel rounded-2xl shadow-premium overflow-hidden border border-white/[0.08]">
              {/* Header Bar */}
              <div className="bg-[#0e1628] px-4 py-3 flex items-center justify-between border-b border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/70 inline-block"></span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">ict-ai-engine.bin</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE FEED
                </span>
              </div>

              {/* Mock Terminal Body */}
              <div className="p-5 space-y-4 font-mono">
                {/* Metric row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400">PREMIUM SWEEP</p>
                    <p className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      1.08940
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400">DISCOUNT OB</p>
                    <p className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <TrendingDown className="h-4 w-4 text-rose-400" />
                      1.08120
                    </p>
                  </div>
                </div>

                {/* Live signals table mock */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 tracking-wider">LATEST DETECTION ALERTS</p>
                  <div className="space-y-1.5 text-xs">
                    {sampleSignals.map((sig, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                        <span className="text-white font-semibold">{sig.pair}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          sig.type.includes("MSS") ? "bg-emerald-500/10 text-emerald-400" :
                          sig.type.includes("Sweep") ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                        }`}>{sig.type}</span>
                        <span className="text-slate-400">{sig.price}</span>
                        <span className="text-[10px] text-slate-500">{sig.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Console Log line */}
                <div className="bg-black/40 p-3 rounded border border-white/[0.05] text-[10px] text-slate-300 space-y-1 overflow-x-auto">
                  <p className="text-blue-400">[info] Fetching market order book: EURUSD...</p>
                  <p className="text-emerald-400">[success] FVG balance filled at 1.08310</p>
                  <p className="text-yellow-400">[warning] MSS validation pending swing high break</p>
                  <p className="text-slate-500 animate-pulse">&gt; listening for institutional blocks...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Details Section */}
      <div id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Automating the Concepts of Inner Circle Trading
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            No more manual drafting. ICT AI Trader&apos;s neural net automatically marks chart ranges, sweeps, shifts, and zones in real-time.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-4 sm:grid-cols-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col bg-white/[0.01] hover:bg-white/[0.02] p-6 rounded-xl border border-white/[0.04] transition-all hover:border-blue-500/20 hover:shadow-[0_4px_25px_rgba(37,99,235,0.03)]">
                <dt className="flex items-center gap-x-3 text-sm font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    {feature.icon}
                  </div>
                  {feature.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-xs leading-relaxed text-slate-400">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Core Technology Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-white/[0.05] bg-gradient-to-b from-transparent to-[#080d17]">
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/20 to-indigo-900/10 p-8 sm:p-12 border border-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.1),transparent_50%)]"></div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to take control of institutional order flow?
            </h2>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-300">
              Get notified of the upcoming release. Phase 1 represents the user interface & structural configurations. Phase 2 introduces full authentication, personal dashboards, custom notification alerts, and active API integrations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleCTA}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all cursor-pointer"
              >
                Join the Beta Queue
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5 text-blue-500" />
                Next: Phase 2 (Authentication)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
