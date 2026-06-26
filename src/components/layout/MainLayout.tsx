import React from "react"
import Header from "./Header"
import Footer from "./Footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1220] text-slate-100 selection:bg-blue-500/30 selection:text-white">
      {/* Navigation Header */}
      <Header />

      {/* Main Page Area wrapped in a responsive width container */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
