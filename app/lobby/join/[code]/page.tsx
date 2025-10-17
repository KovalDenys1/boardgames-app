'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LobbyInvitePage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const code = params.code as string

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      // Redirect to register with return URL
      const returnUrl = `/lobby/join/${code}`
      router.push(`/auth/register?returnUrl=${encodeURIComponent(returnUrl)}`)
    } else if (status === 'authenticated') {
      // User is logged in, redirect to lobby
      router.push(`/lobby/${code}`)
    }
  }, [status, code, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <span className="text-4xl animate-bounce">🎮</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Joining Lobby...</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we redirect you
          </p>
        </div>
        <LoadingSpinner />
      </div>
    </div>
  )
}
