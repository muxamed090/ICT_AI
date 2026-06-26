import React from "react"
import { Cpu, Globe, Terminal, Layers } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: "Solutions",
      links: [
        { label: "Market Structure Shift", href: "#" },
        { label: "Order Block Detection", href: "#" },
        { label: "Fair Value Gaps", href: "#" },
        { label: "Liquidity Sweeps", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Security", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
    {
      title: "Connect",
      links: [
        { label: "Discord Community", href: "#" },
        { label: "Telegram Alert", href: "#" },
        { label: "Documentation", href: "#" },
        { label: "Status Page", href: "#" },
      ],
    },
  ]

  return (
    <footer className="border-t border-white/[0.05] bg-[#070C16]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo / Brand Info */}
          <div className="space-y-4 xl:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 shadow-md">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                ICT AI Trader <span className="text-xs text-blue-500 font-semibold bg-blue-500/10 px-1 py-0.5 rounded">v2.0</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Applying state-of-the-art machine learning algorithms to map Institutional Order Flow, Market Structure Shifts, and Liquidity Pools.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors" title="Website">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" title="Repository">
                <Terminal className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" title="Documentation">
                <Layers className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 sm:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.href} className="text-xs text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 border-t border-white/[0.05] pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} ICT AI Trader. All rights reserved.
          </p>
          <p className="mt-2 text-[10px] text-slate-600 md:mt-0 max-w-md leading-normal">
            Disclaimer: Trading financial instruments involves significant risk. The AI-generated analysis is for informational purposes only and does not constitute financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
