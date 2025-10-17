'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

interface Lobby {
  id: string
  code: string
  name: string
  maxPlayers: number
  creator: { 
    username: string | null
    email: string | null
  }
  games: any[]
}

export default function LobbyListPage() {
  const router = useRouter()
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    loadLobbies()
  }, [])

  const loadLobbies = async () => {
    try {
      const res = await fetch('/api/lobby')
      const data = await res.json()
      setLobbies(data.lobbies || [])
    } catch (error) {
      console.error('Failed to load lobbies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByCode = () => {
    if (joinCode) {
      router.push(`/lobby/${joinCode.toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">🎮 Game Lobbies</h1>
            <Link href="/" className="btn btn-secondary">
              🏠 Home
            </Link>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter lobby code (e.g., ABC123)"
              className="flex-1 input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              onClick={handleJoinByCode}
              disabled={!joinCode}
              className="btn btn-primary"
            >
              Join
            </button>
          </div>

          <Link href="/lobby/create" className="btn btn-success w-full">
            ✨ Create New Lobby
          </Link>
        </div>

        <div className="card animate-slide-in-up">
          <h2 className="text-2xl font-bold mb-4">Active Lobbies</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <LoadingSkeleton key={i} type="card" />
              ))}
            </div>
          ) : lobbies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎲</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No active lobbies yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lobbies.map((lobby, index) => (
                <div
                  key={lobby.id}
                  className="flex justify-between items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => router.push(`/lobby/${lobby.code}`)}
                >
                  <div>
                    <h3 className="font-bold text-lg">{lobby.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {lobby.code}
                      </span>
                      {' • '}
                      Host: <span className="font-semibold">{lobby.creator.username || lobby.creator.email || 'Anonymous'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      lobby.games.length > 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {lobby.games.length > 0 ? '🎮 In Game' : '⏳ Waiting'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Max: {lobby.maxPlayers} players
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
