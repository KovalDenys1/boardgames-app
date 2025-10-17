import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

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

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join lobby with validation
    socket.on('join-lobby', (lobbyCode: string) => {
      if (!lobbyCode || typeof lobbyCode !== 'string') {
        console.error('Invalid lobby code')
        return
      }
      socket.join(`lobby:${lobbyCode}`)
      console.log(`Socket ${socket.id} joined lobby ${lobbyCode}`)
      
      // Notify others in the lobby
      socket.to(`lobby:${lobbyCode}`).emit('player-joined', {
        socketId: socket.id,
        timestamp: Date.now(),
      })
    })

    socket.on('leave-lobby', (lobbyCode: string) => {
      if (!lobbyCode || typeof lobbyCode !== 'string') {
        console.error('Invalid lobby code')
        return
      }
      socket.leave(`lobby:${lobbyCode}`)
      console.log(`Socket ${socket.id} left lobby ${lobbyCode}`)
      
      // Notify others in the lobby
      socket.to(`lobby:${lobbyCode}`).emit('player-left', {
        socketId: socket.id,
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
        socketId: socket.id,
      })
      console.log(`Game action in ${data.lobbyCode}: ${data.action}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
