import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from './lib/db'
import { validateEnv, printEnvInfo } from './lib/env'
import { logger, socketLogger } from './lib/logger'

// Validate environment variables on startup
try {
  validateEnv()
  printEnvInfo()
} catch (error) {
  logger.error('Failed to start server due to environment validation error', error as Error)
  process.exit(1)
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = Number(process.env.PORT) || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : '*'

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
    },
  })

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        console.log('Socket connection rejected: No token provided')
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify JWT token
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
      if (!secret) {
        console.error('JWT secret not configured')
        return next(new Error('Server configuration error'))
      }

      const decoded = jwt.verify(token, secret) as any

      if (!decoded?.id) {
        console.log('Socket connection rejected: Invalid token')
        return next(new Error('Authentication error: Invalid token'))
      }

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true }
      })

      if (!user) {
        console.log('Socket connection rejected: User not found')
        return next(new Error('Authentication error: User not found'))
      }

      // Attach user to socket
      socket.data.user = user
      console.log(`Socket authenticated for user: ${user.username} (${user.id})`)

      next()
    } catch (error) {
      console.log('Socket authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    const user = socket.data.user
    console.log(`Authenticated client connected: ${socket.id} (User: ${user.username})`)

    // Join lobby with validation
    socket.on('join-lobby', async (lobbyCode: string) => {
      if (!lobbyCode || typeof lobbyCode !== 'string') {
        console.error('Invalid lobby code')
        return
      }

      try {
        // Verify user is allowed to join this lobby
        const lobby = await prisma.lobby.findUnique({
          where: { code: lobbyCode },
          include: {
            games: {
              where: {
                status: { in: ['waiting', 'playing'] }
              },
              include: {
                players: {
                  include: { user: true }
                }
              }
            }
          }
        })

        if (!lobby) {
          socket.emit('error', { message: 'Lobby not found' })
          return
        }

        // Check if there's an active game and user is a player
        const activeGame = lobby.games[0]
        if (activeGame) {
          const isPlayer = activeGame.players.some((p: any) => p.userId === user.id)
          if (!isPlayer) {
            socket.emit('error', { message: 'You are not a player in this game' })
            return
          }
        }

        socket.join(`lobby:${lobbyCode}`)
        console.log(`User ${user.username} joined lobby ${lobbyCode}`)

        // Notify others in the lobby
        socket.to(`lobby:${lobbyCode}`).emit('player-joined', {
          userId: user.id,
          username: user.username,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('Error joining lobby:', error)
        socket.emit('error', { message: 'Failed to join lobby' })
      }
    })

    socket.on('leave-lobby', (lobbyCode: string) => {
      if (!lobbyCode || typeof lobbyCode !== 'string') {
        console.error('Invalid lobby code')
        return
      }
      socket.leave(`lobby:${lobbyCode}`)
      console.log(`User ${user.username} left lobby ${lobbyCode}`)

      // Notify others in the lobby
      socket.to(`lobby:${lobbyCode}`).emit('player-left', {
        userId: user.id,
        username: user.username,
        timestamp: Date.now(),
      })
    })

    socket.on('game-action', (data: { lobbyCode: string; action: string; payload: any }) => {
      // Validate data
      if (!data?.lobbyCode || !data?.action || data?.payload === undefined) {
        console.error('Invalid game action data')
        return
      }

      // Broadcast game action to all players in the lobby (including sender)
      io.to(`lobby:${data.lobbyCode}`).emit('game-update', {
        action: data.action,
        payload: data.payload,
        timestamp: Date.now(),
        userId: user.id,
        username: user.username,
      })
      console.log(`Game action by ${user.username} in ${data.lobbyCode}: ${data.action}`)
    })

    socket.on('disconnect', () => {
      console.log(`User ${user.username} disconnected: ${socket.id}`)
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
