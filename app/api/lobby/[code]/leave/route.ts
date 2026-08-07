import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiLogger } from '@/lib/logger'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit'
import { getRequestAuthUser } from '@/lib/request-auth'
import { LOBBY_WITH_GAMES_FOR_LEAVE_INCLUDE, performPlayerLeave } from '@/lib/lobby-leave'

const limiter = rateLimit(rateLimitPresets.api)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const log = apiLogger('POST /api/lobby/[code]/leave')

  try {
    const rateLimitResult = await limiter(req)
    if (rateLimitResult) return rateLimitResult

    const requestUser = await getRequestAuthUser(req)
    const userId = requestUser?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params

    const lobby = await prisma.lobbies.findUnique({
      where: { code },
      include: LOBBY_WITH_GAMES_FOR_LEAVE_INCLUDE,
    })

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
    }

    const result = await performPlayerLeave(lobby, code, userId, log)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: unknown) {
    log.error('Leave lobby error', error)
    return NextResponse.json(
      { error: 'Failed to leave lobby' },
      { status: 500 }
    )
  }
}
