import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit'
import { getRequestAuthUser } from '@/lib/request-auth'
import { pickRelevantLobbyGame } from '@/lib/lobby-snapshot'

const limiter = rateLimit(rateLimitPresets.game)

/**
 * Pinged every ~10s by useLobbyHeartbeat while a client has a lobby/game
 * open (#675). Zero-signal disconnect detection reads this back via
 * lib/lobby-presence.ts's sweepStalePlayers — there's no server-side way to
 * be told a tab closed, so this is the only real signal that exists.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const rateLimitResult = await limiter(request)
  if (rateLimitResult) return rateLimitResult

  const requestUser = await getRequestAuthUser(request)
  if (!requestUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await params

  const lobby = await prisma.lobbies.findUnique({
    where: { code },
    select: {
      games: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, status: true, updatedAt: true },
      },
    },
  })

  if (!lobby) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
  }

  // Only waiting/playing games need a heartbeat — a finished/abandoned/
  // cancelled game has nothing left for disconnect detection to protect.
  const activeGame = pickRelevantLobbyGame(lobby.games)
  if (!activeGame) {
    return NextResponse.json({ tracked: false })
  }

  const { count } = await prisma.players.updateMany({
    where: { gameId: activeGame.id, userId: requestUser.id, leftAt: null },
    data: { lastHeartbeatAt: new Date() },
  })

  // count === 0 is not an error condition — e.g. the player already left
  // via another tab/request racing this one.
  return NextResponse.json({ tracked: count > 0 })
}
