'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="card max-w-2xl w-full text-center animate-bounce-in">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 animate-pulse">
            404
          </h1>
          <div className="text-6xl mb-4 animate-bounce">
            🎲❌🎲
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Oops! Page Not Found
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          The page you're looking for seems to have rolled away...
          <br />
          Maybe it got a Yahtzee and left to celebrate! 🎉
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/"
            className="btn btn-primary w-full md:w-auto px-8 py-4 text-lg inline-block"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🏠</span>
              <span>Go Home</span>
            </span>
          </Link>
          
          <button
            onClick={() => router.back()}
            className="btn btn-secondary w-full md:w-auto px-8 py-4 text-lg ml-0 md:ml-4 mt-4 md:mt-0"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⬅️</span>
              <span>Go Back</span>
            </span>
          </button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Maybe you were looking for:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/lobby"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-125 transition-transform">🎮</div>
              <div className="font-semibold">Browse Lobbies</div>
            </Link>
            <Link
              href="/lobby/create"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-125 transition-transform">✨</div>
              <div className="font-semibold">Create Lobby</div>
            </Link>
          </div>
        </div>

        {/* Fun fact */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Did you know?</strong> The chances of rolling a Yahtzee on the first roll are 1 in 1,296!
          </p>
        </div>
      </div>
    </div>
  )
}
