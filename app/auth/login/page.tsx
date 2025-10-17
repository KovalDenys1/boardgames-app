'use client'

import { Suspense } from 'react'
import LoginForm from './LoginForm'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="card max-w-md w-full">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
