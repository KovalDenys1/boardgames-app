/**
 * Guards the server half of #845: every lobby broadcast must go to the topic
 * that carries the lobby's secret, never to the guessable `lobby:{code}`.
 */

import { prisma } from '@/lib/db'
import { broadcastToLobby } from '@/lib/supabase-server'

jest.mock('@/lib/db', () => ({
  prisma: { lobbies: { findUnique: jest.fn() } },
}))

const mockPrisma = prisma as unknown as { lobbies: { findUnique: jest.Mock } }
// See the note in lobby-realtime-topic.test.ts: keep fixtures unmistakably fake.
const SECRET = 'test-lobby-realtime-secret'

describe('broadcastToLobby', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends to the secret-bearing topic, not to lobby:{code}', async () => {
    mockPrisma.lobbies.findUnique.mockResolvedValue({ realtimeSecret: SECRET })

    const ok = await broadcastToLobby('1234', 'game-update', { payload: 'x' })

    expect(ok).toBe(true)
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.messages[0].topic).toBe(`lobby:1234:${SECRET}`)
    // The bare name is what an outsider can guess, so nothing may go there.
    expect(body.messages[0].topic).not.toBe('lobby:1234')
  })

  it('broadcasts nothing for a lobby that no longer exists', async () => {
    mockPrisma.lobbies.findUnique.mockResolvedValue(null)

    const ok = await broadcastToLobby('1234', 'game-update', {})

    expect(ok).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('asks for the secret explicitly, since lib/db.ts omits it by default', async () => {
    mockPrisma.lobbies.findUnique.mockResolvedValue({ realtimeSecret: SECRET })

    await broadcastToLobby('1234', 'game-update', {})

    expect(mockPrisma.lobbies.findUnique).toHaveBeenCalledWith({
      where: { code: '1234' },
      select: { realtimeSecret: true },
    })
  })
})

describe('broadcastToLobby when the database is unhappy', () => {
  it('returns false instead of rejecting', async () => {
    // Nearly every call site is `void broadcastToLobby(...)`, so a rejection
    // here would surface as an unhandled promise rather than as a failed
    // broadcast. Before #845 this function never touched the database and
    // could not throw; it must keep that property.
    mockPrisma.lobbies.findUnique.mockRejectedValue(new Error('connection lost'))

    await expect(broadcastToLobby('1234', 'game-update', {})).resolves.toBe(false)
  })
})
