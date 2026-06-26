import React from 'react'
import Link from 'next/link'

interface AuthFooterProps {
  mode: 'login' | 'register' | 'forgot' | 'reset'
}

export default function AuthFooter({ mode }: AuthFooterProps) {
  return (
    <div className="text-center text-xs text-slate-400 mt-6 space-y-3 border-t border-white/[0.05] pt-4">
      {mode === 'login' && (
        <>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Sign Up
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-slate-400 hover:text-white transition-colors">
              Forgot your password?
            </Link>
          </p>
        </>
      )}

      {mode === 'register' && (
        <p>
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      )}

      {(mode === 'forgot' || mode === 'reset') && (
        <p>
          Back to{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      )}
    </div>
  )
}
