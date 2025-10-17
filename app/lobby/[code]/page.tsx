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
import toast from 'react-hot-toast'
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
  const [viewingPlayerIndex, setViewingPlayerIndex] = useState<number>(0) // Чью карточку смотрим
  const [timeLeft, setTimeLeft] = useState<number>(60) // Таймер на ход (60 секунд)
  const [timerActive, setTimerActive] = useState<boolean>(false)

  // Helper: Get current player index based on session user ID
  const getCurrentPlayerIndex = () => {
    if (!game?.players || !session?.user?.id) {
      console.log('❌ No game.players or session.user.id:', { 
        hasPlayers: !!game?.players, 
        hasUserId: !!session?.user?.id 
      })
      return -1
    }
    
    const index = game.players.findIndex((p: any) => p.userId === session.user.id)
    console.log('🎮 Current player index:', {
      sessionUserId: session.user.id,
      players: game.players.map((p: any) => ({ id: p.userId, name: p.user?.username })),
      foundIndex: index,
      currentTurn: gameState?.currentPlayerIndex,
      isMyTurn: index === gameState?.currentPlayerIndex
    })
    return index
  }

  // Helper: Check if it's current user's turn
  const isMyTurn = () => {
    if (!gameState) return false
    const myIndex = getCurrentPlayerIndex()
    const result = myIndex !== -1 && myIndex === gameState.currentPlayerIndex
    console.log(`🔄 Is my turn? ${result} (myIndex: ${myIndex}, currentTurn: ${gameState.currentPlayerIndex})`)
    return result
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      loadLobby()
    }
  }, [code, status])

  // Автоматически показываем карточку текущего пользователя при загрузке
  useEffect(() => {
    if (game?.players && session?.user?.id) {
      const myIndex = getCurrentPlayerIndex()
      if (myIndex !== -1) {
        setViewingPlayerIndex(myIndex)
      }
    }
  }, [game?.players, session?.user?.id])

  // Таймер на ход
  useEffect(() => {
    if (!gameState || gameState.finished || !timerActive) return

    // Сбрасываем таймер при смене хода
    if (isMyTurn()) {
      setTimeLeft(60)
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && isMyTurn()) {
          // Время вышло - автоматически выбираем первую доступную категорию с 0 очков
          handleTimeOut()
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState?.currentPlayerIndex, timerActive, gameState?.finished])

  // Активируем таймер когда игра начинается
  useEffect(() => {
    if (gameState && !gameState.finished && game?.players?.length >= 2) {
      setTimerActive(true)
    } else {
      setTimerActive(false)
    }
  }, [gameState, game?.players?.length])

  useEffect(() => {
    if (!lobby || !code) return

    // Initialize socket connection
    if (!socket) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      console.log('🔌 Connecting to Socket.IO:', url)
      
      socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id)
        socket.emit('join-lobby', code)
        toast.info('Connected to game server')
      })

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect()
        }
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        toast.error('Connection error. Please refresh the page.')
      })

      socket.on('game-update', (data) => {
        console.log('📡 Game update received:', data)
        if (data.action === 'state-change') {
          const updatedState = data.payload
          
          // Validate and fix state
          if (!updatedState.scores || !Array.isArray(updatedState.scores)) {
            updatedState.scores = []
          }
          if (!updatedState.held || !Array.isArray(updatedState.held)) {
            updatedState.held = [false, false, false, false, false]
          }
          if (!updatedState.dice || !Array.isArray(updatedState.dice)) {
            updatedState.dice = rollDice()
          }
          
          console.log('🎲 Setting new game state:', updatedState)
          setGameState(updatedState)
          
          // Reload lobby data to get updated player scores
          loadLobby()
        } else if (data.action === 'player-left') {
          toast.info(`${data.payload.username || 'A player'} left the lobby`)
          
          if (data.payload.gameEnded) {
            toast.warning('⚠️ Game ended! Not enough players remaining.')
            setGameState(null)
          }
          
          // Reload lobby to update player list
          loadLobby()
        }
      })
    }

    return () => {
      if (socket && socket.connected) {
        console.log('🔌 Disconnecting socket')
        socket.emit('leave-lobby', code)
        socket.disconnect()
        socket = null as any
      }
    }
  }, [lobby, code])

  const loadLobby = async () => {
    try {
      console.log('🔄 Loading lobby:', code)
      const res = await fetch(`/api/lobby/${code}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load lobby')
      }

      console.log('✅ Lobby loaded:', data.lobby)
      setLobby(data.lobby)
      
      const activeGame = data.lobby.games.find((g: any) =>
        ['waiting', 'playing'].includes(g.status)
      )
      if (activeGame) {
        console.log('🎮 Active game found:', activeGame)
        setGame(activeGame)
        if (activeGame.state) {
          try {
            const parsedState = JSON.parse(activeGame.state)
            console.log('🎲 Parsed game state:', parsedState)
            
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
            // Ensure currentPlayerIndex exists
            if (typeof parsedState.currentPlayerIndex !== 'number') {
              console.warn('⚠️ currentPlayerIndex is missing, setting to 0')
              parsedState.currentPlayerIndex = 0
            }
            
            console.log('✅ Final game state:', parsedState)
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

  const handleTimeOut = async () => {
    if (!gameState || !game) return

    // Находим первую незаполненную категорию и ставим 0
    const categories: YahtzeeCategory[] = [
      'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
      'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight',
      'largeStraight', 'yahtzee', 'chance'
    ]

    const playerIndex = gameState.currentPlayerIndex
    const currentScorecard = gameState.scores[playerIndex] || {}
    
    // Находим первую доступную категорию
    const availableCategory = categories.find(cat => currentScorecard[cat] === undefined)
    
    if (availableCategory) {
      toast.error('⏰ Time is up! First available category filled with 0 points.')
      await handleScoreSelection(availableCategory)
    }
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
      // Остановить таймер, когда игра заканчивается
      setTimerActive(false)
      
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
    
    // Активировать таймер
    setTimerActive(true)
    setTimeLeft(60)
    
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

  const handleLeaveLobby = async () => {
    if (!confirm('Are you sure you want to leave this lobby? The game will end if only one player remains.')) {
      return
    }

    try {
      const res = await fetch(`/api/lobby/${code}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave lobby')
      }

      // Notify other players via socket
      if (socket) {
        socket.emit('game-action', {
          lobbyCode: code,
          action: 'player-left',
          payload: {
            userId: session?.user?.id,
            username: session?.user?.name,
            gameEnded: data.gameEnded,
          },
        })
      }

      // Show success message
      if (data.gameEnded) {
        toast.success('You left the lobby. The game has ended.')
      } else {
        toast.success('You left the lobby.')
      }

      // Redirect to lobby list
      router.push('/lobby')
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave lobby')
    }
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">{lobby.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Code: <span className="font-mono font-bold text-lg">{lobby.code}</span>
              </p>
            </div>
            <button onClick={handleLeaveLobby} className="btn btn-secondary">
              Leave
            </button>
          </div>
          
          {/* Invite Link */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  🔗 Invite Friends
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/lobby/join/${lobby.code}` : ''}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/lobby/join/${lobby.code}`)
                        toast.success('📋 Invite link copied to clipboard!')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Share this link with friends to invite them to this lobby
                </p>
              </div>
            </div>
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
                players={game.players.map((p: any, index: number) => ({
                  id: p.id,
                  userId: p.userId,
                  user: {
                    username: p.user.username,
                    email: p.user.email,
                  },
                  score: calculateTotalScore(gameState.scores[index] || {}), // Показываем актуальный счёт
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
                  {game?.players?.length < 2 ? (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                      ⏳ Waiting for more players to join... (minimum 2 players)
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                      ✅ Ready to start!
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Roll the dice, score big, and have fun!
                  </p>
                </div>
                
                {/* Only lobby creator can start the game */}
                {lobby?.creatorId === session?.user?.id ? (
                  <button 
                    onClick={handleStartGame}
                    disabled={game?.players?.length < 2}
                    className="btn btn-success text-lg px-8 py-3 animate-bounce-in disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎮 Start Yahtzee Game
                  </button>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4">
                    <p className="text-blue-700 dark:text-blue-300 font-semibold">
                      ⏳ Waiting for host to start the game...
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Host: {lobby?.creator?.username || lobby?.creator?.email || 'Unknown'}
                    </p>
                  </div>
                )}
              </div>
            ) : gameState?.finished ? (
              <div className="card text-center animate-scale-in">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 animate-bounce-in">
                    <span className="text-6xl">🏆</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
                  <p className="text-gray-600 dark:text-gray-400">13 rounds completed</p>
                </div>
                
                {/* Winner Announcement */}
                {(() => {
                  const scores = game?.players?.map((player: any, i: number) => ({
                    name: player.user.username || `Player ${i + 1}`,
                    score: calculateTotalScore(gameState.scores[i] || {}),
                    index: i,
                    scorecard: gameState.scores[i] || {},
                  })).sort((a: any, b: any) => b.score - a.score)
                  
                  const winner = scores[0]
                  const isWinner = winner.name === session?.user?.name || 
                                  game?.players[winner.index]?.userId === session?.user?.id
                  
                  return (
                    <div className="mb-8 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl">
                      <p className="text-2xl font-bold mb-2">
                        {isWinner ? '🎊 You Won! 🎊' : `🏆 ${winner.name} Wins! 🏆`}
                      </p>
                      <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                        {winner.score} points
                      </p>
                    </div>
                  )
                })()}
                
                {/* Winner Podium */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Final Standings</h3>
                  {game?.players
                    ?.map((player: any, i: number) => {
                      const scorecard = gameState.scores[i] || {}
                      const upperSection = (scorecard.ones || 0) + (scorecard.twos || 0) + 
                        (scorecard.threes || 0) + (scorecard.fours || 0) + 
                        (scorecard.fives || 0) + (scorecard.sixes || 0)
                      const bonus = upperSection >= 63 ? 35 : 0
                      
                      return {
                        name: player.user.username || `Player ${i + 1}`,
                        score: calculateTotalScore(scorecard),
                        index: i,
                        upperSection,
                        bonus,
                      }
                    })
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((player: any, rank: number) => (
                      <div
                        key={player.index}
                        className={`
                          p-4 mb-3 rounded-lg transition-all duration-300
                          ${rank === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white scale-105 shadow-xl' : ''}
                          ${rank === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg' : ''}
                          ${rank === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 shadow-lg' : ''}
                          ${rank > 2 ? 'bg-gray-100 dark:bg-gray-700' : ''}
                          transform
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold">
                              {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                            </span>
                            <div className="text-left">
                              <p className="text-xl font-semibold">{player.name}</p>
                              <p className={`text-sm ${rank === 0 ? 'text-yellow-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                Upper: {player.upperSection} {player.bonus > 0 ? `+${player.bonus} bonus` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-3xl font-bold">{player.score}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex gap-4 justify-center">
                  <button onClick={handleStartGame} className="btn btn-success text-lg px-8 py-3">
                    🔄 Play Again
                  </button>
                  <button onClick={() => router.push('/lobby')} className="btn btn-secondary text-lg px-8 py-3">
                    🏠 Back to Lobbies
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Game Status Bar */}
                <div className="card mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm opacity-90">Round</p>
                      <p className="text-3xl font-bold">{Math.floor(gameState.round / (game?.players?.length || 1)) + 1} / 13</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-90">Current Player</p>
                      <p className="text-lg font-bold truncate">
                        {game.players[gameState.currentPlayerIndex]?.user?.username || 'Player'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-90">Your Score</p>
                      <p className="text-3xl font-bold">
                        {calculateTotalScore(gameState.scores[getCurrentPlayerIndex()] || {})}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-90">Time Left</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`text-3xl font-bold ${
                          timeLeft <= 10 ? 'text-red-300 animate-pulse' : 
                          timeLeft <= 30 ? 'text-yellow-300' : ''
                        }`}>
                          {timeLeft}s
                        </div>
                        {timeLeft <= 10 && (
                          <span className="text-2xl animate-bounce">⏰</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dice Section - Left Column */}
                <div className="lg:col-span-1">
                  <DiceGroup
                    dice={gameState.dice}
                    held={gameState.held}
                    onToggleHold={handleToggleHold}
                    disabled={gameState.rollsLeft === 3 || !isMyTurn()}
                  />
                  
                  {/* Roll Button */}
                  <div className="card mt-4">
                    {/* Turn Indicator */}
                    <div className={`text-center mb-4 p-4 rounded-lg transition-all ${
                      isMyTurn() 
                        ? timeLeft <= 10 
                          ? 'bg-red-100 dark:bg-red-900 border-2 border-red-500 animate-pulse' 
                          : timeLeft <= 30
                            ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500'
                            : 'bg-green-100 dark:bg-green-900 border-2 border-green-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {isMyTurn() ? (
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            🎯 YOUR TURN!
                          </p>
                          <div className={`text-3xl font-extrabold ${
                            timeLeft <= 10 
                              ? 'text-red-600 dark:text-red-400' 
                              : timeLeft <= 30
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            <span className={timeLeft <= 10 ? 'animate-bounce inline-block' : ''}>
                              {timeLeft <= 10 ? '⏰' : '⏱️'}
                            </span> {timeLeft}s
                          </div>
                          {timeLeft <= 10 && (
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                              ⚠️ Hurry up! Time is running out!
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                          ⏳ Waiting for {game.players[gameState.currentPlayerIndex]?.user?.username || 'player'}...
                        </p>
                      )}
                    </div>
                    
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Rolls Left: {gameState.rollsLeft}
                      </p>
                      {gameState.rollsLeft === 0 && isMyTurn() && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Choose a category to score
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleRollDice}
                      disabled={gameState.rollsLeft === 0 || !isMyTurn()}
                      className="btn btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
                    >
                      🎲 Roll Dice
                    </button>
                  </div>
                </div>

                {/* Scorecard Section - Right Columns */}
                <div className="lg:col-span-2">
                  {/* Player Selector */}
                  <div className="card mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        View Player's Scorecard
                      </h3>
                      <div className="flex gap-2">
                        {game?.players?.map((player: any, index: number) => {
                          const isMe = player.userId === session?.user?.id
                          const isViewing = viewingPlayerIndex === index
                          const isCurrentTurn = gameState.currentPlayerIndex === index
                          
                          return (
                            <button
                              key={player.id}
                              onClick={() => setViewingPlayerIndex(index)}
                              className={`
                                px-4 py-2 rounded-lg font-semibold transition-all relative
                                ${isViewing 
                                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }
                              `}
                            >
                              {isMe ? '👤 You' : player.user?.username || `Player ${index + 1}`}
                              {isCurrentTurn && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Current Viewing Info */}
                    <div className={`p-3 rounded-lg ${
                      viewingPlayerIndex === getCurrentPlayerIndex()
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {viewingPlayerIndex === getCurrentPlayerIndex() ? (
                            <>
                              <span className="text-2xl">📊</span>
                              <div>
                                <p className="font-bold text-blue-700 dark:text-blue-300">Your Scorecard</p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  {isMyTurn() ? "It's your turn!" : "Waiting for your turn..."}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">👀</span>
                              <div>
                                <p className="font-bold text-yellow-700 dark:text-yellow-300">
                                  Viewing: {game?.players[viewingPlayerIndex]?.user?.username || `Player ${viewingPlayerIndex + 1}`}
                                </p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                  {gameState.currentPlayerIndex === viewingPlayerIndex 
                                    ? "Currently playing..." 
                                    : "Waiting for turn"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {calculateTotalScore(gameState.scores[viewingPlayerIndex] || {})}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Score</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Scorecard
                    scorecard={gameState.scores[viewingPlayerIndex] || {}}
                    currentDice={gameState.dice}
                    onSelectCategory={handleScoreSelection}
                    canSelectCategory={gameState.rollsLeft < 3 && isMyTurn() && viewingPlayerIndex === getCurrentPlayerIndex()}
                    isCurrentPlayer={viewingPlayerIndex === getCurrentPlayerIndex()}
                  />
                </div>
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
