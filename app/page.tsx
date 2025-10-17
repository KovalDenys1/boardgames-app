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
      <div className="card max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          🎲 BoardGames
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Play Yahtzee and other board games with friends online
        </p>

        {isLoggedIn ? (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/lobby')}
              className="btn btn-primary w-full text-lg py-3"
            >
              Browse Lobbies
            </button>
            <button
              onClick={() => router.push('/lobby/create')}
              className="btn btn-success w-full text-lg py-3"
            >
              Create New Lobby
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn btn-secondary w-full"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Link href="/auth/login" className="btn btn-primary w-full text-lg py-3 block">
              Login
            </Link>
            <Link href="/auth/register" className="btn btn-success w-full text-lg py-3 block">
              Register
            </Link>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="space-y-1">
            <li>✓ User registration and authentication</li>
            <li>✓ Create lobbies with passwords</li>
            <li>✓ Share lobby links with friends</li>
            <li>✓ Real-time multiplayer Yahtzee</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
