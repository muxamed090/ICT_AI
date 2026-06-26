"use client"

import React from "react"
import Link from "next/link"
import { Menu, Search, Bell, Cpu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface TopNavProps {
  isSidebarCollapsed: boolean
  setIsMobileOpen: (open: boolean) => void
}

export default function TopNav({
  isSidebarCollapsed,
  setIsMobileOpen
}: TopNavProps) {
  const { user } = useAuth()

  return (
    <header className="h-16 w-full bg-[#070C16] border-b border-white/[0.04] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
      
      {/* Left: Mobile hamburger menu toggle & mobile logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/[0.03]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="md:hidden flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 shadow-md">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">ICT AI</span>
        </div>

        {/* Small desktop breadcrumb context if collapsed */}
        {isSidebarCollapsed && (
          <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
            Console
          </div>
        )}
      </div>

      {/* Middle: Styled Search Bar */}
      <div className="hidden sm:flex max-w-md w-full mx-4">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search assets, order blocks, FVG signals..."
            className="w-full bg-[#0B1220] border border-white/[0.06] hover:border-white/[0.12] focus:border-blue-600 focus:ring-blue-600/20 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2"
          />
        </div>
      </div>

      {/* Right: Actions (Notification & User Initial Avatar) */}
      <div className="flex items-center gap-4">
        {/* Search icon for mobile screen */}
        <button className="sm:hidden text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-white/[0.03]">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-white/[0.03]">
          <span className="sr-only">View notifications</span>
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </button>

        {/* User Profile initials */}
        <Link href="/dashboard/profile" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all uppercase">
            {user?.email ? user.email.charAt(0) : "U"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[11px] font-bold text-white leading-none">Account</p>
            <p className="text-[9px] text-slate-500 font-medium leading-none mt-1">Verified</p>
          </div>
        </Link>
      </div>

    </header>
  )
}
