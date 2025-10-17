'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useToast } from '@/contexts/ToastContext'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send reset email')
      }

      toast.success('Reset link sent! Check your email.')
      setSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            If an account exists with <strong>{email}</strong>, you will receive password reset instructions.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Didn't receive an email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="btn btn-secondary w-full"
            >
              Send Another Email
            </button>
            <Link href="/auth/login" className="btn btn-primary w-full block">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Forgot Password?
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Enter your email and we'll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              disabled={loading}
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link 
            href="/auth/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
