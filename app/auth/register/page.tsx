'use client'

import { Suspense } from 'react'
import RegisterForm from './RegisterForm'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="card max-w-md w-full">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
