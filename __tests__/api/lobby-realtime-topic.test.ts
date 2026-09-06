/**
 * @jest-environment @edge-runtime/jest-environment
 */
// @ts-nocheck - Prisma and route mocks are intentionally lightweight in route tests.

/**
 * Guards #845. The realtime broadcast topic used to be `lobby:{code}` with a
 * four-digit code, so subscribing to any lobby was a matter of enumerating ten
 * thousand names. The topic now carries a per-lobby secret and these are the
 * two places that hand it out.
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/lobby/[code]/realtime-topic/route'
import { prisma } from '@/lib/db'
import { getRequestAuthUser } from '@/lib/request-auth'
import { buildLobbyTopic } from '@/lib/lobby-realtime-topic'

jest.mock('@/lib/db', () => ({
  prisma: { lobbies: { findUnique: jest.fn() } },
}))

jest.mock('@/lib/request-auth', () => ({
  getRequestAuthUser: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => jest.fn(() => Promise.resolve(null))),
  rateLimitPresets: { api: {} },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetRequestAuthUser = getRequestAuthUser as jest.MockedFunction<typeof getRequestAuthUser>

// Deliberately not random-looking: a realistic 32-char hex fixture reads as
// a leaked credential to secret scanners.
const SECRET = 'test-lobby-realtime-secret'

function request() {
  return new NextRequest('http://localhost/api/lobby/1234/realtime-topic')
}

const params = Promise.resolve({ code: '1234' })

describe('GET /api/lobby/[code]/realtime-topic', () => {
  beforeEach(() => jest.clearAllMocks())

  it('refuses a caller with no identity', async () => {
    mockGetRequestAuthUser.mockResolvedValue(null)

    const res = await GET(request(), { params })

    expect(res.status).toBe(401)
    expect(mockPrisma.lobbies.findUnique).not.toHaveBeenCalled()
  })

  it('refuses someone who is not in the lobby', async () => {
    mockGetRequestAuthUser.mockResolvedValue({ id: 'outsider', isGuest: false })
    // The membership filter runs in the query, so a non-member comes back with
    // the game listed and no players in it.
    mockPrisma.lobbies.findUnique.mockResolvedValue({
      realtimeSecret: SECRET,
      games: [{ players: [] }],
    })

    const res = await GET(request(), { params })

    expect(res.status).toBe(403)
    expect(JSON.stringify(await res.json())).not.toContain(SECRET)
  })

  it('gives a member the topic name', async () => {
    mockGetRequestAuthUser.mockResolvedValue({ id: 'player-1', isGuest: false })
    mockPrisma.lobbies.findUnique.mockResolvedValue({
      realtimeSecret: SECRET,
      games: [{ players: [{ id: 'p1' }] }],
    })

    const res = await GET(request(), { params })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ topic: `lobby:1234:${SECRET}` })
  })

  it('still counts a player whose last game is finished (#877)', async () => {
    // The result screen is where the host presses Play Again; the other player
    // only learns about the new game over realtime, so a finished roster must
    // still open the topic. Cancelled and abandoned games stay out.
    mockGetRequestAuthUser.mockResolvedValue({ id: 'player-1', isGuest: false })
    mockPrisma.lobbies.findUnique.mockResolvedValue({
      realtimeSecret: SECRET,
      games: [{ players: [{ id: 'p1' }] }],
    })

    const res = await GET(request(), { params })

    expect(res.status).toBe(200)
    const query = mockPrisma.lobbies.findUnique.mock.calls[0][0]
    expect(query.select.games.where.status.in).toEqual(['waiting', 'playing', 'finished'])
  })

  it('404s on a lobby that does not exist, rather than leaking that it might', async () => {
    mockGetRequestAuthUser.mockResolvedValue({ id: 'player-1', isGuest: false })
    mockPrisma.lobbies.findUnique.mockResolvedValue(null)

    const res = await GET(request(), { params })

    expect(res.status).toBe(404)
  })
})

describe('buildLobbyTopic', () => {
  it('is the single definition of the name both sides use', () => {
    // Server and client build the topic from the same helper on purpose: a
    // mismatch would not error, it would silently deliver nothing.
    expect(buildLobbyTopic('1234', SECRET)).toBe(`lobby:1234:${SECRET}`)
  })
})
