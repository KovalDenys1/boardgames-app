import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit'
import { getRequestAuthUser } from '@/lib/request-auth'

const limiter = rateLimit(rateLimitPresets.api)
const schema = z.object({ count: z.number().int().min(0).max(500) })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const rateLimitResult = await limiter(request)
  if (rateLimitResult) return rateLimitResult

  // Only a resolved identity (session or guest) may report a spectator count —
  // the spectate page itself never calls this without one already resolved.
  const requestUser = await getRequestAuthUser(request)
  if (!requestUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid count' }, { status: 400 })
  }

  const lobby = await prisma.lobbies.findUnique({
    where: { code },
    select: { id: true, allowSpectators: true, maxSpectators: true },
  })

  if (!lobby) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
  }

  if (!lobby.allowSpectators) {
    return NextResponse.json({ error: 'Spectators not allowed' }, { status: 403 })
  }

  // The count is a client report, so it cannot be trusted to be honest — and an
  // inflated one is not harmless: the spectate route refuses everyone once the
  // stored count reaches maxSpectators, so any caller could lock a lobby's
  // spectators out by reporting a large number (#804). Clamp to the lobby's own
  // limit, which is the highest value that can ever be legitimate.
  const reported = parsed.data.count
  const count = lobby.maxSpectators > 0 ? Math.min(reported, lobby.maxSpectators) : reported

  await prisma.lobbies.update({
    where: { id: lobby.id },
    data: { spectatorCount: count },
  })

  return NextResponse.json({ success: true })
}
