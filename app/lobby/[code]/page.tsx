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
import Chat from '@/components/Chat'
import { soundManager } from '@/lib/sounds'
import { useConfetti } from '@/hooks/useConfetti'

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
  const [viewingPlayerIndex, setViewingPlayerIndex] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { celebrate, fireworks } = useConfetti()
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatMinimized, setChatMinimized] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [someoneTyping, setSomeoneTyping] = useState(false)

  // Debounce for game state updates to avoid excessive re-renders
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (game?.players && session?.user?.id) {
      const myIndex = getCurrentPlayerIndex()
      if (myIndex !== -1) {
        setViewingPlayerIndex(myIndex)
      }
    }
  }, [game?.players, session?.user?.id])

  useEffect(() => {
    if (!gameState || gameState.finished || !timerActive) return

    setTimeLeft(60)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (!isMyTurn()) return prev
        
        if (prev <= 1) {
          handleTimeOut()
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState?.currentPlayerIndex, timerActive, gameState?.finished])

  useEffect(() => {
    if (gameState && !gameState.finished && game?.players?.length >= 2) {
      setTimerActive(true)
    } else {
      setTimerActive(false)
    }
  }, [gameState, game?.players?.length])

  useEffect(() => {
    if (!lobby || !code) return

    if (!socket) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      console.log('🔌 Connecting to Socket.IO:', url)

      // Get NextAuth session token from cookies
      const getAuthToken = () => {
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=')
          if (name === 'next-auth.session-token') {
            return value
          }
        }
        return null
      }

      const token = getAuthToken()
      
      socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10, // More attempts
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, // Max delay between attempts
        timeout: 20000, // Connection timeout
        autoConnect: true,
        auth: {
          token: token
        },
        query: {
          token: token
        },
      })

      let isFirstConnection = true

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id)
        socket.emit('join-lobby', code)
        
        // Only show toast on first connection, not on reconnects
        if (isFirstConnection) {
          isFirstConnection = false
        }
      })

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        // Auto-reconnect is handled by Socket.IO
        // Only manually reconnect if server initiated disconnect
        if (reason === 'io server disconnect') {
          socket.connect()
        }
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        // Don't show toast on every error - it's annoying
        // Socket.IO will auto-retry with exponential backoff
      })

      socket.on('game-update', (data) => {
        console.log('📡 Game update received:', data)
        
        if (data.action === 'state-change') {
          // Clear previous timeout to debounce rapid updates
          if (updateTimeout) {
            clearTimeout(updateTimeout)
          }
          
          const updatedState = data.payload
          
          if (!updatedState.scores || !Array.isArray(updatedState.scores)) {
            updatedState.scores = []
          }
          if (!updatedState.held || !Array.isArray(updatedState.held)) {
            updatedState.held = [false, false, false, false, false]
          }
          if (!updatedState.dice || !Array.isArray(updatedState.dice)) {
            updatedState.dice = rollDice()
          }
          
          // Play sounds for other players based on what changed
          if (gameState) {
            // Check if dice were rolled (rollsLeft decreased)
            if (updatedState.rollsLeft < gameState.rollsLeft) {
              soundManager.play('diceRoll')
            }
            
            // Check if turn changed (new player's turn)
            if (updatedState.currentPlayerIndex !== gameState.currentPlayerIndex) {
              soundManager.play('turnChange')
              
              // Check if it's now my turn
              const myIndex = getCurrentPlayerIndex()
              if (myIndex === updatedState.currentPlayerIndex) {
                // Small delay so sounds don't overlap
                setTimeout(() => {
                  soundManager.play('click')
                }, 300)
              }
            }
            
            // Check if someone scored (round increased or scores changed)
            if (updatedState.round > gameState.round) {
              soundManager.play('score')
            }
            
            // Check if game just finished
            if (!gameState.finished && updatedState.finished) {
              soundManager.play('win')
              setTimeout(() => {
                fireworks()
              }, 200)
            }
          }
          
          console.log('🎲 Setting new game state:', updatedState)
          setGameState(updatedState)
          
          // Debounce lobby reload to avoid excessive API calls
          const timeout = setTimeout(() => {
            loadLobby()
          }, 500)
          setUpdateTimeout(timeout)
          
        } else if (data.action === 'player-left') {
          // Don't show toast if it's the current user leaving (they get their own success message)
          const isCurrentUser = data.payload.userId === session?.user?.id
          
          if (!isCurrentUser) {
            toast.info(`${data.payload.username || 'A player'} left the lobby`)
          }
          
          if (data.payload.gameEnded) {
            if (!isCurrentUser) {
              toast.warning('⚠️ Game ended! Not enough players remaining.')
            }
            setGameState(null)
          }
          loadLobby()
        } else if (data.action === 'chat-message') {
          // Add chat message to state, but avoid duplicates
          setChatMessages(prev => {
            const messageExists = prev.some(msg => msg.id === data.payload.id)
            if (messageExists) return prev
            
            // Play sound for new messages from other users
            if (data.payload.userId !== session?.user?.id) {
              soundManager.play('message')
              
              // Increment unread count if chat is minimized
              if (chatMinimized) {
                setUnreadMessageCount(prev => prev + 1)
              }
            }
            
            return [...prev, data.payload]
          })
          
          // Show notification for other users
          if (data.payload.userId !== session?.user?.id) {
            // Optional: show toast for new messages if chat is minimized
            if (chatMinimized) {
              toast.info(`💬 ${data.payload.username}: ${data.payload.message}`)
            }
          }
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
      
      // Clear any pending update timeouts
      if (updateTimeout) {
        clearTimeout(updateTimeout)
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
            
            if (!parsedState.scores || !Array.isArray(parsedState.scores)) {
              parsedState.scores = []
            }
            if (!parsedState.held || !Array.isArray(parsedState.held)) {
              parsedState.held = [false, false, false, false, false]
            }
            if (!parsedState.dice || !Array.isArray(parsedState.dice)) {
              parsedState.dice = rollDice()
            }
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
      
      // Notify lobby list about player joining
      socket?.emit('player-joined')
      
      // Add system message to chat
      const joinMessage = {
        id: Date.now().toString() + '_join',
        userId: 'system',
        username: 'System',
        message: `${session?.user?.name || 'A player'} joined the lobby`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...prev, joinMessage])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRollDice = async () => {
    if (!gameState || !game) return

    // Validate that it's the current player's turn
    if (!isMyTurn()) {
      toast.error('🚫 It\'s not your turn to roll the dice!')
      return
    }

    // Validate that there are rolls left
    if (gameState.rollsLeft === 0) {
      toast.error('🚫 No rolls left! Choose a category to score.')
      return
    }

    const newDice = gameState.dice.map((die, i) =>
      gameState.held[i] ? die : Math.floor(Math.random() * 6) + 1
    )

    const newState = {
      ...gameState,
      dice: newDice,
      rollsLeft: gameState.rollsLeft - 1,
    }

    setGameState(newState)
    await saveGameState(game.id, newState)
    
    soundManager.play('diceRoll')
    
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: newState,
    })

    // Check if this was the last roll and only one category remains
    if (newState.rollsLeft === 0) {
      const categories: YahtzeeCategory[] = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight',
        'largeStraight', 'yahtzee', 'chance'
      ]

      const playerIndex = newState.currentPlayerIndex
      const currentScorecard = newState.scores[playerIndex] || {}
      const availableCategories = categories.filter(cat => currentScorecard[cat] === undefined)

      if (availableCategories.length === 1) {
        // Automatically select the last remaining category
        const lastCategory = availableCategories[0]
        toast.info(`🎯 Last roll! Automatically scoring in ${lastCategory.replace(/([A-Z])/g, ' $1').trim()}...`)
        
        // Small delay for better UX
        setTimeout(() => {
          handleScoreSelection(lastCategory)
        }, 1500)
      } else {
        toast.info('Last roll! Choose a category to score.')
      }
    }
  }

  const handleToggleHold = (index: number) => {
    if (!gameState || gameState.rollsLeft === 3) return

    const newHeld = [...gameState.held]
    newHeld[index] = !newHeld[index]

    soundManager.play('click')

    const newState = { ...gameState, held: newHeld }
    setGameState(newState)
  }

  const handleTimeOut = async () => {
    if (!gameState || !game) return

    const categories: YahtzeeCategory[] = [
      'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
      'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight',
      'largeStraight', 'yahtzee', 'chance'
    ]

    const playerIndex = gameState.currentPlayerIndex
    const currentScorecard = gameState.scores[playerIndex] || {}
    const availableCategory = categories.find(cat => currentScorecard[cat] === undefined)
    
    if (availableCategory) {
      toast.error('⏰ Time is up! First available category filled with 0 points.')
      await handleScoreSelection(availableCategory)
    }
  }

  const handleScoreSelection = async (category: YahtzeeCategory) => {
    if (!gameState || !game) return

    // Validate that it's the current player's turn
    if (!isMyTurn()) {
      toast.error('🚫 It\'s not your turn to score!')
      return
    }

    // Validate that the player has rolled at least once (rollsLeft < 3)
    if (gameState.rollsLeft === 3) {
      toast.error('🚫 You must roll the dice at least once before scoring!')
      return
    }

    // Validate that the category is not already used
    const currentPlayerIndex = getCurrentPlayerIndex()
    const currentScorecard = gameState.scores[currentPlayerIndex] || {}
    if (currentScorecard[category] !== undefined) {
      toast.error('🚫 This category is already scored!')
      return
    }

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
    await saveGameState(game.id, newState, allFinished ? 'finished' : 'playing')
    
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: newState,
    })

    const categoryName = category.replace(/([A-Z])/g, ' $1').trim()
    toast.success(`Scored ${score} points in ${categoryName}!`)
    
    // Play score sound and celebrate if it's a good score
    soundManager.play('score')
    if (score >= 20) {
      celebrate()
    }
    
    if (allFinished) {
      setTimerActive(false)
      
      const scores = newScores.map(sc => calculateTotalScore(sc))
      const maxScore = Math.max(...scores)
      const winnerIndex = scores.indexOf(maxScore)
      const winnerName = game.players[winnerIndex]?.user?.username || 'Player ' + (winnerIndex + 1)
      
      // Play win sound and fireworks for game completion
      soundManager.play('win')
      fireworks()
      
      toast.success(`🎉 Game Over! ${winnerName} wins with ${maxScore} points!`)

      // Add system message to chat
      const gameEndMessage = {
        id: Date.now().toString() + '_gameend',
        userId: 'system',
        username: 'System',
        message: `🎉 Game Over! ${winnerName} wins with ${maxScore} points!`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...prev, gameEndMessage])
    } else if (nextPlayerIndex !== playerIndex) {
      const nextPlayerName = game.players[nextPlayerIndex]?.user?.username || 'Player ' + (nextPlayerIndex + 1)
      soundManager.play('turnChange')
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
    setTimerActive(true)
    setTimeLeft(60)
    
    await saveGameState(game.id, initialState, 'playing')
    
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'state-change',
      payload: initialState,
    })

    const firstPlayerName = game.players[0]?.user?.username || 'Player 1'
    toast.success(`🎲 Game started! ${firstPlayerName} goes first!`)

    // Add system message to chat
    const gameStartMessage = {
      id: Date.now().toString() + '_gamestart',
      userId: 'system',
      username: 'System',
      message: `🎲 Game started! ${firstPlayerName} goes first!`,
      timestamp: Date.now(),
      type: 'system'
    }
    setChatMessages(prev => [...prev, gameStartMessage])
  }

  const handleSendChatMessage = (message: string) => {
    if (!session?.user?.id || !session?.user?.name) return

    const chatMessage = {
      id: Date.now().toString() + Math.random(),
      userId: session.user.id,
      username: session.user.name,
      message: message,
      timestamp: Date.now(),
      type: 'message'
    }

    // Add to local state immediately for instant feedback
    setChatMessages(prev => [...prev, chatMessage])

    // Send to other players via Socket.IO
    socket?.emit('game-action', {
      lobbyCode: code,
      action: 'chat-message',
      payload: chatMessage,
    })
  }

  const clearChat = () => {
    setChatMessages([])
    setUnreadMessageCount(0)
    toast.success('🗑️ Chat cleared!')
  }

  const handleToggleChat = () => {
    setChatMinimized(prev => {
      const newState = !prev
      // Reset unread count when opening chat
      if (!newState) {
        setUnreadMessageCount(0)
      }
      return newState
    })
  }

  const handleLeaveLobby = async () => {

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

      // Show single success message
      toast.success(data.gameEnded ? 'Game ended' : 'Left lobby')

      // Add system message to chat
      const leaveMessage = {
        id: Date.now().toString() + '_leave',
        userId: 'system',
        username: 'System',
        message: `${session?.user?.name || 'A player'} left the lobby`,
        timestamp: Date.now(),
        type: 'system'
      }
      setChatMessages(prev => [...prev, leaveMessage])

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
  const isGameStarted = gameState !== null && game?.status === 'playing'
  const isWaitingInLobby = isInGame && !isGameStarted

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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  soundManager.toggle()
                  setSoundEnabled(soundManager.isEnabled())
                  toast.success(soundManager.isEnabled() ? '🔊 Sound enabled' : '🔇 Sound disabled')
                }} 
                className="btn btn-secondary"
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <button onClick={handleLeaveLobby} className="btn btn-secondary">
                Leave
              </button>
            </div>
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
            {/* Player List - показываем только когда есть игроки */}
            {game?.players && game.players.length > 0 && (
              <PlayerList
                players={game.players.map((p: any, index: number) => ({
                  id: p.id,
                  userId: p.userId,
                  user: {
                    username: p.user.username,
                    email: p.user.email,
                  },
                  score: gameState ? calculateTotalScore(gameState.scores[index] || {}) : 0,
                  position: p.position || game.players.indexOf(p),
                  isReady: true,
                }))}
                currentTurn={gameState?.currentPlayerIndex ?? -1}
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
                
                {lobby?.creatorId === session?.user?.id ? (
                  <button 
                    onClick={() => {
                      soundManager.play('click')
                      handleStartGame()
                    }}
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

      {/* Chat Component */}
      {isInGame && (
        <Chat
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          currentUserId={session?.user?.id}
          isMinimized={chatMinimized}
          onToggleMinimize={handleToggleChat}
          onClearChat={clearChat}
          unreadCount={unreadMessageCount}
          someoneTyping={someoneTyping}
        />
      )}
    </div>
  )
}
