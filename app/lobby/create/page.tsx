'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { io } from 'socket.io-client'

export default function CreateLobbyPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    maxPlayers: 4,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lobby')
      }

      // Notify lobby list about new lobby via WebSocket
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const socket = io(socketUrl)
      socket.emit('lobby-created')
      socket.disconnect()

      // Redirect to the new lobby
      router.push(`/lobby/${data.lobby.code}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-white/80 text-sm">
          <button 
            onClick={() => router.push('/')}
            className="hover:text-white transition-colors"
          >
            🏠 Home
          </button>
          <span>›</span>
          <button 
            onClick={() => router.push('/games')}
            className="hover:text-white transition-colors"
          >
            🎮 Games
          </button>
          <span>›</span>
          <button 
            onClick={() => router.push('/games/yahtzee/lobbies')}
            className="hover:text-white transition-colors"
          >
            🎲 Yahtzee
          </button>
          <span>›</span>
          <span className="text-white font-semibold">Create Lobby</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <span className="text-5xl">✨</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Create New Lobby</h1>
          <p className="text-xl text-white/90">Set up your Yahtzee game and invite friends to join!</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-2 border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lobby Name */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                🎮 Lobby Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Friday Night Game"
                className="w-full px-4 py-3 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 backdrop-blur-sm text-white placeholder-white/60 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-white/80 mt-1">
                Choose a memorable name for your lobby
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                🔒 Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave empty for public lobby"
                className="w-full px-4 py-3 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent bg-white/20 backdrop-blur-sm text-white placeholder-white/60 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-white/80 mt-1">
                Set a password to make your lobby private
              </p>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                👥 Maximum Players *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[2, 3, 4, 6, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, maxPlayers: num })}
                    className={`px-4 py-3 rounded-xl font-bold transition-all ${
                      formData.maxPlayers === num
                        ? 'bg-white text-blue-600 shadow-lg scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/80 mt-2">
                Select how many players can join
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-400 text-white px-4 py-3 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/games/yahtzee/lobbies')}
                className="flex-1 px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Create Lobby
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">💡 Quick Tips:</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>You'll be automatically added as the first player</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>Share the lobby code with friends to invite them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>Start the game when everyone is ready!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

