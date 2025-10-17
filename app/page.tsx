'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="card max-w-2xl w-full text-center animate-scale-in">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white animate-bounce-in">
            🎲 BoardGames
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2 animate-fade-in">
            Play Yahtzee and other board games with friends online
          </p>
          {isLoggedIn && (
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
              Welcome back, <span className="font-semibold">{session.user?.email || session.user?.name}</span>! 👋
            </p>
          )}
        </div>

        {isLoggedIn ? (
          <div className="space-y-4 animate-slide-in-up">
            <button
              onClick={() => router.push('/lobby')}
              className="btn btn-primary w-full text-lg py-4 shadow-xl hover:shadow-2xl"
            >
              <span className="flex items-center justify-center gap-2">
                <span>🎮</span>
                <span>Browse Lobbies</span>
              </span>
            </button>
            <button
              onClick={() => router.push('/lobby/create')}
              className="btn btn-success w-full text-lg py-4 shadow-xl hover:shadow-2xl"
            >
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                <span>Create New Lobby</span>
              </span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn btn-secondary w-full"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-in-up">
            <Link href="/auth/login" className="btn btn-primary w-full text-lg py-4 shadow-xl hover:shadow-2xl block">
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span>
                <span>Login</span>
              </span>
            </Link>
            <Link href="/auth/register" className="btn btn-success w-full text-lg py-4 shadow-xl hover:shadow-2xl block">
              <span className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>Register</span>
              </span>
            </Link>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-10 text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
          <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-200">✨ Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:scale-105 transition-transform">
              <span className="text-green-500 font-bold">✓</span>
              <span>User registration and authentication</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:scale-105 transition-transform">
              <span className="text-green-500 font-bold">✓</span>
              <span>Create lobbies with passwords</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:scale-105 transition-transform">
              <span className="text-green-500 font-bold">✓</span>
              <span>Share lobby links with friends</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:scale-105 transition-transform">
              <span className="text-green-500 font-bold">✓</span>
              <span>Real-time multiplayer Yahtzee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
