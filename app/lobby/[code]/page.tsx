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
import { useToast } from '@/contexts/ToastContext'
import DiceGroup from '@/components/DiceGroup'
import Scorecard from '@/components/Scorecard'
import PlayerList from '@/components/PlayerList'
import LoadingSpinner from '@/components/LoadingSpinner'

let socket: Socket

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const toast = useToast()
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
          const updatedState = data.payload
          // Ensure scores array exists
          if (!updatedState.scores || !Array.isArray(updatedState.scores)) {
            updatedState.scores = []
          }
          // Ensure held array exists
          if (!updatedState.held || !Array.isArray(updatedState.held)) {
            updatedState.held = [false, false, false, false, false]
          }
          // Ensure dice array exists
          if (!updatedState.dice || !Array.isArray(updatedState.dice)) {
            updatedState.dice = rollDice()
          }
          setGameState(updatedState)
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
            const parsedState = JSON.parse(activeGame.state)
            // Ensure scores array exists and is properly initialized
            if (!parsedState.scores || !Array.isArray(parsedState.scores)) {
              parsedState.scores = []
            }
            // Ensure held array exists
            if (!parsedState.held || !Array.isArray(parsedState.held)) {
              parsedState.held = [false, false, false, false, false]
            }
            // Ensure dice array exists
            if (!parsedState.dice || !Array.isArray(parsedState.dice)) {
              parsedState.dice = rollDice()
            }
            setGameState(parsedState)
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

    // Show notification on last roll
    if (newState.rollsLeft === 0) {
      toast.info('Last roll! Choose a category to score.')
    }
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

    // Show notifications
    const categoryName = category.replace(/([A-Z])/g, ' $1').trim()
    toast.success(`Scored ${score} points in ${categoryName}!`)
    
    if (allFinished) {
      // Calculate winner
      const scores = newScores.map(sc => calculateTotalScore(sc))
      const maxScore = Math.max(...scores)
      const winnerIndex = scores.indexOf(maxScore)
      const winnerName = game.players[winnerIndex]?.user?.username || 'Player ' + (winnerIndex + 1)
      
      toast.success(`🎉 Game Over! ${winnerName} wins with ${maxScore} points!`)
    } else if (nextPlayerIndex !== playerIndex) {
      const nextPlayerName = game.players[nextPlayerIndex]?.user?.username || 'Player ' + (nextPlayerIndex + 1)
      toast.info(`${nextPlayerName}'s turn!`)
    }
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

    // Show notification
    const firstPlayerName = game.players[0]?.user?.username || 'Player 1'
    toast.success(`🎲 Game started! ${firstPlayerName} goes first!`)
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
            {/* Player List */}
            {game?.players && gameState && (
              <PlayerList
                players={game.players.map((p: any) => ({
                  id: p.id,
                  userId: p.userId,
                  user: {
                    username: p.user.username,
                    email: p.user.email,
                  },
                  score: 0,
                  position: p.position || game.players.indexOf(p),
                  isReady: true,
                }))}
                currentTurn={gameState.currentPlayerIndex}
                currentUserId={session?.user?.id}
              />
            )}

            {!isGameStarted ? (
              <div className="card text-center animate-scale-in">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                    <span className="text-4xl">🎲</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Ready to Play Yahtzee?</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {game?.players?.length || 0} player(s) in lobby
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Roll the dice, score big, and have fun!
                  </p>
                </div>
                <button 
                  onClick={handleStartGame} 
                  className="btn btn-success text-lg px-8 py-3 animate-bounce-in"
                >
                  🎮 Start Yahtzee Game
                </button>
              </div>
            ) : gameState?.finished ? (
              <div className="card text-center animate-scale-in">
                <h2 className="text-4xl font-bold mb-6">🎉 Game Over!</h2>
                
                {/* Winner Podium */}
                <div className="mb-6">
                  {game?.players
                    ?.map((player: any, i: number) => ({
                      name: player.user.username || `Player ${i + 1}`,
                      score: calculateTotalScore(gameState.scores[i] || {}),
                      index: i,
                    }))
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((player: any, rank: number) => (
                      <div
                        key={player.index}
                        className={`
                          p-4 mb-3 rounded-lg flex items-center justify-between
                          ${rank === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white scale-105' : ''}
                          ${rank === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' : ''}
                          ${rank === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400' : ''}
                          ${rank > 2 ? 'bg-gray-100 dark:bg-gray-700' : ''}
                          transform transition-all duration-300
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold">
                            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                          </span>
                          <span className="text-xl font-semibold">{player.name}</span>
                        </div>
                        <span className="text-2xl font-bold">{player.score} pts</span>
                      </div>
                    ))}
                </div>

                <button onClick={handleStartGame} className="btn btn-success text-lg px-8 py-3">
                  🔄 Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dice Section - Left Column */}
                <div className="lg:col-span-1">
                  <DiceGroup
                    dice={gameState.dice}
                    held={gameState.held}
                    onToggleHold={handleToggleHold}
                    disabled={
                      gameState.rollsLeft === 3 ||
                      gameState.currentPlayerIndex !==
                        game.players.findIndex((p: any) => p.userId === session?.user?.id)
                    }
                  />
                  
                  {/* Roll Button */}
                  <div className="card mt-4">
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Rolls Left: {gameState.rollsLeft}
                      </p>
                      {gameState.rollsLeft === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Choose a category to score
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleRollDice}
                      disabled={
                        gameState.rollsLeft === 0 ||
                        gameState.currentPlayerIndex !==
                          game.players.findIndex((p: any) => p.userId === session?.user?.id)
                      }
                      className="btn btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
                    >
                      🎲 Roll Dice
                    </button>
                  </div>
                </div>

                {/* Scorecard Section - Right Columns */}
                <div className="lg:col-span-2">
                  <Scorecard
                    scorecard={gameState.scores[gameState.currentPlayerIndex] || {}}
                    currentDice={gameState.dice}
                    onSelectCategory={handleScoreSelection}
                    canSelectCategory={
                      gameState.rollsLeft < 3 &&
                      gameState.currentPlayerIndex ===
                        game.players.findIndex((p: any) => p.userId === session?.user?.id)
                    }
                    isCurrentPlayer={
                      gameState.currentPlayerIndex ===
                        game.players.findIndex((p: any) => p.userId === session?.user?.id)
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
