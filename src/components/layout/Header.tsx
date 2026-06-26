"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Cpu, Menu, X, ArrowRight, Activity, LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "AI Engine", href: "/#ai-engine" },
    { label: "Performance", href: "/#performance" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#0B1220]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <Link href="/" className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ICT AI <span className="text-blue-500 font-extrabold bg-blue-500/10 px-1.5 py-0.5 rounded text-xs tracking-wider">v2.0</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-1">
                Precision Trader
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Call to Action Button / User profile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              Engine Online
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-lg">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all cursor-pointer"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.05] bg-[#0B1220]/95 backdrop-blur-lg">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/[0.05] mt-4 pt-4 px-3 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium w-fit">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                Engine Online
              </div>

              {user ? (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 break-all px-1">
                    Logged in as: <strong className="text-slate-200">{user.email}</strong>
                  </div>
                  <button
                    onClick={() => {
                      signOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600/15 border border-rose-500/25 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
