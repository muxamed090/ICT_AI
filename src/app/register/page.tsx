"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Cpu, Check } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterInput } from "@/features/auth/schemas"
import AuthLayout from "@/components/auth/AuthLayout"
import AuthCard from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { PasswordInput } from "@/components/auth/PasswordInput"
import SocialLoginSection from "@/components/auth/SocialLoginSection"
import AuthFooter from "@/components/auth/AuthFooter"
import LoadingButton from "@/components/auth/LoadingButton"
import ValidationMessage from "@/components/auth/ValidationMessage"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const passwordVal = watch("password", "")

  // Complexity indicator items
  const requirements = [
    { label: "Minimum 8 characters", valid: passwordVal.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(passwordVal) },
    { label: "Lowercase letter", valid: /[a-z]/.test(passwordVal) },
    { label: "Number", valid: /[0-9]/.test(passwordVal) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(passwordVal) },
  ]

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setError(null)

    try {
      const emailRedirectTo = `${window.location.origin}/api/auth/callback`
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else if (signUpData.user) {
        // Redirect to email confirmation instruction page
        router.push(`/email-verification?email=${encodeURIComponent(data.email)}`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during sign up.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ICT AI Trader</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Create your account</h2>
        <p className="text-xs text-slate-400 mt-1">Start tracking institutional blocks today</p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ValidationMessage type="error" message={error} />

          <AuthInput
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {/* Real-time Password Checker */}
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password Requirements</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                    req.valid ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-slate-600"
                  }`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className={req.valid ? "text-slate-300" : "text-slate-500"}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <LoadingButton loading={loading}>
            Create Account
          </LoadingButton>
        </form>

        <div className="mt-6">
          <SocialLoginSection />
        </div>

        <AuthFooter mode="register" />
      </AuthCard>
    </AuthLayout>
  )
}
