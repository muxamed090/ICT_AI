import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import MainLayout from "@/components/layout/MainLayout"
import { AuthProvider } from "@/components/auth/AuthProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ICT AI Trader v2.0 - Precision AI-Driven Market Structure & Liquidity Engine",
  description: "Institutional-grade order flow tracking, market structure shift analysis, and liquidity sweep detection powered by next-generation artificial intelligence.",
  keywords: ["ICT trading", "Order block", "Fair Value Gap", "Liquidity sweeps", "AI Trading", "Market Structure Shift"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0B1220]`}
      >
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
