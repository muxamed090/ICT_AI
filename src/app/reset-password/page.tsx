"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Cpu, Check } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas"
import AuthLayout from "@/components/auth/AuthLayout"
import AuthCard from "@/components/auth/AuthCard"
import { PasswordInput } from "@/components/auth/PasswordInput"
import AuthFooter from "@/components/auth/AuthFooter"
import LoadingButton from "@/components/auth/LoadingButton"
import ValidationMessage from "@/components/auth/ValidationMessage"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const passwordVal = watch("password", "")

  const requirements = [
    { label: "Minimum 8 characters", valid: passwordVal.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(passwordVal) },
    { label: "Lowercase letter", valid: /[a-z]/.test(passwordVal) },
    { label: "Number", valid: /[0-9]/.test(passwordVal) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(passwordVal) },
  ]

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess("Password updated successfully! Redirecting to home page...")
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during password update.")
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
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
        <p className="text-xs text-slate-400 mt-1">Choose a strong, complex new password</p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ValidationMessage type="error" message={error} />
          <ValidationMessage type="success" message={success} />

          {!success && (
            <>
              <PasswordInput
                label="New Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />

              {/* Password complexity display */}
              <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">New Password Rules</p>
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
                label="Confirm New Password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <LoadingButton loading={loading}>
                Save Password
              </LoadingButton>
            </>
          )}
        </form>

        <AuthFooter mode="reset" />
      </AuthCard>
    </AuthLayout>
  )
}
