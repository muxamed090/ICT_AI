"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Cpu } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas"
import AuthLayout from "@/components/auth/AuthLayout"
import AuthCard from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import AuthFooter from "@/components/auth/AuthFooter"
import LoadingButton from "@/components/auth/LoadingButton"
import ValidationMessage from "@/components/auth/ValidationMessage"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccess("Check your inbox! We have emailed you a password recovery link.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
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
        <h2 className="text-2xl font-bold text-white">Recover Password</h2>
        <p className="text-xs text-slate-400 mt-1">We will send a secure reset link to your email</p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ValidationMessage type="error" message={error} />
          <ValidationMessage type="success" message={success} />

          {!success && (
            <>
              <AuthInput
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <LoadingButton loading={loading}>
                Send Recovery Link
              </LoadingButton>
            </>
          )}
        </form>

        <AuthFooter mode="forgot" />
      </AuthCard>
    </AuthLayout>
  )
}
