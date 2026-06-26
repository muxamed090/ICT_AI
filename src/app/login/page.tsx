"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Cpu } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginInput } from "@/features/auth/schemas"
import AuthLayout from "@/components/auth/AuthLayout"
import AuthCard from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { PasswordInput } from "@/components/auth/PasswordInput"
import SocialLoginSection from "@/components/auth/SocialLoginSection"
import AuthFooter from "@/components/auth/AuthFooter"
import LoadingButton from "@/components/auth/LoadingButton"
import ValidationMessage from "@/components/auth/ValidationMessage"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during sign in.")
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
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-xs text-slate-400 mt-1">Access your institutional trading intelligence</p>
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

          <LoadingButton loading={loading}>
            Sign In
          </LoadingButton>
        </form>

        <div className="mt-6">
          <SocialLoginSection />
        </div>

        <AuthFooter mode="login" />
      </AuthCard>
    </AuthLayout>
  )
}
