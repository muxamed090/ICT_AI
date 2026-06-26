"use client"

import React, { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Cpu, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

import AuthLayout from "@/components/auth/AuthLayout"
import AuthCard from "@/components/auth/AuthCard"

// Wrap the hook-using component in a Suspense boundary for Next.js static prerendering
function VerificationContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || "your email address"

  return (
    <>
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ICT AI Trader</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="text-xs text-slate-400 mt-1">We sent a verification link to confirm your account</p>
      </div>

      <AuthCard>
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 animate-pulse">
            <Mail className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">
              We have sent a verification email to:
            </p>
            <p className="text-sm font-semibold text-white break-all bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05]">
              {email}
            </p>
          </div>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Please click on the confirmation link inside the email to complete the registration. If you don&apos;t see the email, verify your spam folder.
          </p>

          <div className="w-full border-t border-white/[0.05] pt-4">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
            >
              Return to Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AuthCard>
    </>
  )
}

export default function EmailVerificationPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <VerificationContent />
      </Suspense>
    </AuthLayout>
  )
}
