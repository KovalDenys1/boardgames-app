'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Lobby {
  id: string
  code: string
  name: string
  maxPlayers: number
  creator: { username: string }
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
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Lobbies</h1>
            <Link href="/" className="btn btn-secondary">
              Home
            </Link>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter lobby code (e.g., ABC123)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
            />
            <button
              onClick={handleJoinByCode}
              disabled={!joinCode}
              className="btn btn-primary"
            >
              Join by Code
            </button>
          </div>

          <Link href="/lobby/create" className="btn btn-success w-full">
            Create New Lobby
          </Link>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Active Lobbies</h2>

          {loading ? (
            <p>Loading...</p>
          ) : lobbies.length === 0 ? (
            <p className="text-gray-500">No active lobbies. Create one!</p>
          ) : (
            <div className="space-y-2">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/lobby/${lobby.code}`)}
                >
                  <div>
                    <h3 className="font-bold">{lobby.name}</h3>
                    <p className="text-sm text-gray-500">
                      Code: {lobby.code} • Host: {lobby.creator.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {lobby.games.length > 0 ? '🎮 In Game' : '⏳ Waiting'}
                    </p>
                    <p className="text-xs text-gray-500">Max: {lobby.maxPlayers}</p>
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
