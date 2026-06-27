"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Zap, 
  Cpu, 
  Star, 
  BookOpen, 
  Settings, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
  Calendar,
  Sliders
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Market Overview", href: "/dashboard/market-overview", icon: <BarChart2 className="h-4 w-4" /> },
    { label: "Watchlist", href: "/dashboard/watchlist", icon: <Star className="h-4 w-4" /> },
    { label: "Economic Calendar", href: "/dashboard/economic-calendar", icon: <Calendar className="h-4 w-4" /> },
    { label: "Signals", href: "/dashboard/signals", icon: <Zap className="h-4 w-4" /> },
    { label: "AI Analysis", href: "/dashboard/ai-analysis", icon: <Cpu className="h-4 w-4" /> },
    { label: "Rules Engine", href: "/dashboard/rules", icon: <Sliders className="h-4 w-4" /> },
    { label: "Journal", href: "/dashboard/journal", icon: <BookOpen className="h-4 w-4" /> },
  ]

  const bottomItems = [
    { label: "Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
  ]

  const handleLogout = async () => {
    await signOut()
  }

  // Sidebar content markup
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#070C16] border-r border-white/[0.04]">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
              ICT AI <span className="text-[10px] text-blue-400 font-extrabold bg-blue-500/10 px-1 py-0.2 rounded uppercase">v2.0</span>
            </span>
          )}
        </Link>
        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2 ${isCollapsed && !isMobileOpen ? "sr-only" : ""}`}>
          Main Menu
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => isMobileOpen && setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" 
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                }`}
                title={isCollapsed && !isMobileOpen ? item.label : ""}
              >
                {item.icon}
                {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 pt-4 mb-2 ${isCollapsed && !isMobileOpen ? "sr-only" : ""}`}>
          Configuration
        </p>
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => isMobileOpen && setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" 
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                }`}
                title={isCollapsed && !isMobileOpen ? item.label : ""}
              >
                {item.icon}
                {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Area / User Info / Logout */}
      <div className="p-3 border-t border-white/[0.04] bg-[#050911]/60 space-y-2">
        {(!isCollapsed || isMobileOpen) && user && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 uppercase">
              {user.email ? user.email.charAt(0) : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-white truncate">{user.email}</p>
              <p className="text-[9px] text-slate-500 font-medium">Standard Account</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors cursor-pointer`}
          title={isCollapsed && !isMobileOpen ? "Log Out" : ""}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
        </button>

        {/* Collapse Button (Desktop only) */}
        <div className="hidden md:block pt-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full py-1 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-md transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar Layout */}
      <aside className={`hidden md:block h-screen shrink-0 transition-all duration-300 ${isCollapsed ? "w-16" : "w-60"}`}>
        <div className="h-full w-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 transform md:hidden transition-transform duration-300 ease-in-out ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="h-full w-full">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
