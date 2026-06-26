"use client"

import React, { useState } from "react"
import Sidebar from "@/components/sidebar/Sidebar"
import TopNav from "@/components/navigation/TopNav"

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B1220] text-slate-100 font-sans">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNav
          isSidebarCollapsed={isSidebarCollapsed}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 bg-[#0B1220] relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
          
          {/* Internal footer */}
          <footer className="mt-12 py-6 border-t border-white/[0.04] text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ICT AI Trader. Internal trading system v2.0
          </footer>
        </main>
      </div>
    </div>
  )
}
