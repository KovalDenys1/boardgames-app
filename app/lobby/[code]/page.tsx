'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import {
  YahtzeeGameState,
  YahtzeeCategory,
  rollDice,
  calculateScore,
  calculateTotalScore,
  isGameFinished,
} from '@/lib/yahtzee'
import { saveGameState } from '@/lib/game'

let socket: Socket

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const code = params.code as string

  const [lobby, setLobby] = useState<any>(null)
  const [game, setGame] = useState<any>(null)
  const [gameState, setGameState] = useState<YahtzeeGameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      loadLobby()
    }
  }, [code, status])

  useEffect(() => {
    if (!socket && lobby) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL
      socket = url ? io(url) : io()
      socket.emit('join-lobby', code)

      socket.on('game-update', (data) => {
        console.log('Game update:', data)
        if (data.action === 'state-change') {
          setGameState(data.payload)
        }
      })
    }

    return () => {
      if (socket) {
        socket.emit('leave-lobby', code)
        socket.disconnect()
      }
    }
  }, [lobby, code])

  const loadLobby = async () => {
    try {
      const res = await fetch(`/api/lobby/${code}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load lobby')
      }

      setLobby(data.lobby)
      
      const activeGame = data.lobby.games.find((g: any) =>
        ['waiting', 'playing'].includes(g.status)
      )
      if (activeGame) {
        setGame(activeGame)
        if (activeGame.state) {
          try {
            setGameState(JSON.parse(activeGame.state))
          } catch (parseError) {
            console.error('Failed to parse game state:', parseError)
            setError('Game state is corrupted. Please start a new game.')
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinLobby = async () => {
    try {
      if (!session?.user?.id) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`/api/lobby/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join lobby')
      }

      setGame(data.game)
      await loadLobby()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRollDice = async () => {
    if (!gameState || !game) return

    const newDice = gameState.dice.map((die, i) =>
      gameState.held[i] ? die : Math.floor(Math.random() * 6) + 1
    )

    const newState = {
      ...gameState,
      dice: newDice,
      rollsLeft: gameState.rollsLeft - 1,
    }

    setGameState(newState)
    
    // Save to database
    await saveGameState(game.id, newState)
    
    // Broadcast to other players
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: newState,
    })
  }

  const handleToggleHold = (index: number) => {
    if (!gameState || gameState.rollsLeft === 3) return

    const newHeld = [...gameState.held]
    newHeld[index] = !newHeld[index]

    const newState = { ...gameState, held: newHeld }
    setGameState(newState)
  }

  const handleScoreSelection = async (category: YahtzeeCategory) => {
    if (!gameState || !game) return

    const playerIndex = gameState.currentPlayerIndex
    const score = calculateScore(gameState.dice, category)
    
    const newScores = [...gameState.scores]
    newScores[playerIndex] = {
      ...newScores[playerIndex],
      [category]: score,
    }

    const nextPlayerIndex = (playerIndex + 1) % game.players.length
    const allFinished = newScores.every(sc => isGameFinished(sc))

    const newState: YahtzeeGameState = {
      ...gameState,
      scores: newScores,
      currentPlayerIndex: nextPlayerIndex,
      dice: rollDice(),
      held: [false, false, false, false, false],
      rollsLeft: 3,
      round: gameState.round + 1,
      finished: allFinished,
    }

    setGameState(newState)
    
    // Save to database (with finished status if game ended)
    await saveGameState(game.id, newState, allFinished ? 'finished' : 'playing')
    
    // Broadcast to other players
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: newState,
    })
  }

  const handleStartGame = async () => {
    if (!game) return

    const initialState: YahtzeeGameState = {
      round: 0,
      currentPlayerIndex: 0,
      dice: rollDice(),
      held: [false, false, false, false, false],
      rollsLeft: 3,
      scores: game.players.map(() => ({})),
      finished: false,
    }

    setGameState(initialState)
    
    // Save to database
    await saveGameState(game.id, initialState, 'playing')
    
    // Broadcast to other players
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: initialState,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <h1 className="text-2xl font-bold mb-4">Lobby Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push('/lobby')} className="btn btn-primary">
            Back to Lobbies
          </button>
        </div>
      </div>
    )
  }

  const isInGame = game?.players?.some((p: any) => p.userId === session?.user?.id)
  const isGameStarted = gameState !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="card mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{lobby.name}</h1>
              <p className="text-gray-600">
                Code: <span className="font-mono font-bold text-lg">{lobby.code}</span>
              </p>
            </div>
            <button onClick={() => router.push('/lobby')} className="btn btn-secondary">
              Leave
            </button>
          </div>
        </div>

        {!isInGame ? (
          <div className="card max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Join Game</h2>
            {lobby.password && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <button onClick={handleJoinLobby} className="btn btn-primary w-full">
              Join Lobby
            </button>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <h2 className="text-xl font-bold mb-2">Players</h2>
              <div className="space-y-2">
                {game?.players?.map((player: any, i: number) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span className="font-medium">
                      {i + 1}. {player.user.username}
                      {gameState && gameState.currentPlayerIndex === i && ' ← Current'}
                    </span>
                    {gameState && (
                      <span className="font-bold">
                        {calculateTotalScore(gameState.scores[i] || {})} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {!isGameStarted ? (
              <div className="card text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
                <p className="text-gray-600 mb-4">
                  {game?.players?.length || 0} player(s) in lobby
                </p>
                <button onClick={handleStartGame} className="btn btn-success text-lg px-8 py-3">
                  Start Yahtzee Game
                </button>
              </div>
            ) : gameState?.finished ? (
              <div className="card text-center">
                <h2 className="text-3xl font-bold mb-4">🎉 Game Over!</h2>
                <div className="space-y-2 mb-4">
                  {game?.players?.map((player: any, i: number) => (
                    <div key={player.id} className="text-lg">
                      {player.user.username}: {calculateTotalScore(gameState.scores[i])} points
                    </div>
                  ))}
                </div>
                <button onClick={handleStartGame} className="btn btn-success">
                  Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <YahtzeeGame
                  gameState={gameState}
                  onRoll={handleRollDice}
                  onToggleHold={handleToggleHold}
                  onScoreSelect={handleScoreSelection}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function YahtzeeGame({
  gameState,
  onRoll,
  onToggleHold,
  onScoreSelect,
}: {
  gameState: YahtzeeGameState
  onRoll: () => void
  onToggleHold: (index: number) => void
  onScoreSelect: (category: YahtzeeCategory) => void
}) {
  const categories: { key: YahtzeeCategory; label: string }[] = [
    { key: 'ones', label: 'Ones' },
    { key: 'twos', label: 'Twos' },
    { key: 'threes', label: 'Threes' },
    { key: 'fours', label: 'Fours' },
    { key: 'fives', label: 'Fives' },
    { key: 'sixes', label: 'Sixes' },
    { key: 'threeOfKind', label: 'Three of a Kind' },
    { key: 'fourOfKind', label: 'Four of a Kind' },
    { key: 'fullHouse', label: 'Full House' },
    { key: 'smallStraight', label: 'Small Straight' },
    { key: 'largeStraight', label: 'Large Straight' },
    { key: 'yahtzee', label: 'Yahtzee!' },
    { key: 'chance', label: 'Chance' },
  ]

  const currentScore = gameState.scores[gameState.currentPlayerIndex] || {}

  return (
    <>
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Dice</h2>
        
        <div className="flex gap-2 justify-center mb-6">
          {gameState.dice.map((die, i) => (
            <button
              key={i}
              className={`dice ${gameState.held[i] ? 'held' : ''}`}
              onClick={() => onToggleHold(i)}
              disabled={gameState.rollsLeft === 3}
            >
              {die}
            </button>
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-lg font-bold">Rolls left: {gameState.rollsLeft}</p>
        </div>

        <button
          onClick={onRoll}
          disabled={gameState.rollsLeft === 0}
          className="btn btn-primary w-full text-lg"
        >
          🎲 Roll Dice
        </button>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Scorecard</h2>
        
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {categories.map(({ key, label }) => {
            const isFilled = currentScore[key] !== undefined
            const potentialScore = calculateScore(gameState.dice, key)

            return (
              <div
                key={key}
                className={`scorecard-row ${isFilled ? 'filled' : ''}`}
                onClick={() => !isFilled && gameState.rollsLeft < 3 && onScoreSelect(key)}
              >
                <span>{label}</span>
                <span className="font-bold">
                  {isFilled ? currentScore[key] : `(${potentialScore})`}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center font-bold text-lg">
          <span>Total Score</span>
          <span>{calculateTotalScore(currentScore)}</span>
        </div>
      </div>
    </>
  )
}
