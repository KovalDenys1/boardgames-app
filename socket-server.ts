import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { parse } from 'url'

const port = Number(process.env.PORT) || 3001
const hostname = process.env.HOSTNAME || '0.0.0.0'

const server = createServer((req, res) => {
  const url = parse(req.url || '/')
  if (url.pathname === '/health') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
    return
  }
  // Minimal root response for sanity checks
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Socket.IO server is running')
})

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : '*'

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
  },
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-lobby', (lobbyCode: string) => {
    socket.join(`lobby:${lobbyCode}`)
    console.log(`Socket ${socket.id} joined lobby ${lobbyCode}`)
  })

  socket.on('leave-lobby', (lobbyCode: string) => {
    socket.leave(`lobby:${lobbyCode}`)
    console.log(`Socket ${socket.id} left lobby ${lobbyCode}`)
  })

  socket.on('game-action', (data: { lobbyCode: string; action: string; payload: any }) => {
    io.to(`lobby:${data.lobbyCode}`).emit('game-update', {
      action: data.action,
      payload: data.payload,
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

server.listen(port, hostname, () => {
  console.log(`Socket.IO server ready on http://${hostname}:${port}`)
})
