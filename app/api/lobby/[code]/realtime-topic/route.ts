import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit'
import { getRequestAuthUser } from '@/lib/request-auth'
import { buildLobbyTopic } from '@/lib/lobby-realtime-topic'

const apiLimiter = rateLimit(rateLimitPresets.api)

/**
 * Hands a lobby member the name of the realtime topic to subscribe to.
 *
 * The name carries a per-lobby secret (#845), so this is the gate that used to
 * not exist: before, the topic was `lobby:{code}` and the code is four digits.
 * The membership check is the same one GET /api/lobby/[code]/chat applies.
 * Spectators do not come through here — the spectate endpoint returns the topic
 * itself, after its own allowSpectators, password and limit checks.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invalid lobby code' }, { status: 400 })
  }

  const rateLimitResult = await apiLimiter(req)
  if (rateLimitResult) return rateLimitResult

  const user = await getRequestAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lobby = await prisma.lobbies.findUnique({
    where: { code },
    select: {
      realtimeSecret: true,
      games: {
        where: { status: { in: ['waiting', 'playing'] } },
        select: {
          players: { where: { userId: user.id }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!lobby) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
  }

  const isPlayer = lobby.games.some((g) => g.players.length > 0)
  if (!isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ topic: buildLobbyTopic(code, lobby.realtimeSecret) })
}
