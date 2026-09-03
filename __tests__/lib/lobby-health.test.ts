// @ts-nocheck

import { cleanupStaleLobbiesAndGames, sweepStaleLobbiesIfDue } from '@/lib/lobby-health'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  prisma: {
    lobbies: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    games: {
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('cleanupStaleLobbiesAndGames', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.lobbies.findMany.mockResolvedValue([])
    mockPrisma.lobbies.updateMany.mockResolvedValue({ count: 0 } as any)
    mockPrisma.games.updateMany.mockResolvedValue({ count: 0 } as any)
  })

  it('deactivates lobbies without active waiting/playing games', async () => {
    mockPrisma.lobbies.findMany.mockResolvedValue([
      {
        id: 'lobby-empty',
        code: 'EMPTY1',
        games: [],
      },
    ] as any)
    mockPrisma.lobbies.updateMany
      .mockResolvedValueOnce({ count: 1 } as any)
      .mockResolvedValueOnce({ count: 0 } as any)
    mockPrisma.games.updateMany
      .mockResolvedValueOnce({ count: 0 } as any)
      .mockResolvedValueOnce({ count: 0 } as any)

    const result = await cleanupStaleLobbiesAndGames({
      now: new Date('2026-02-27T21:00:00.000Z'),
    })

    expect(result.success).toBe(true)
    expect(result.scannedLobbies).toBe(1)
    expect(result.scannedActiveGames).toBe(0)
    expect(result.deactivatedLobbies).toBe(1)
    expect(result.cancelledWaitingGames).toBe(0)
    expect(result.abandonedPlayingGames).toBe(0)
    expect(mockPrisma.lobbies.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['lobby-empty'] },
        }),
      })
    )
  })

  it('cancels stale waiting games and abandons stale playing games', async () => {
    const now = new Date('2026-02-27T21:00:00.000Z')
    mockPrisma.lobbies.findMany.mockResolvedValue([
      {
        id: 'lobby-waiting',
        code: 'WAIT1',
        games: [
          {
            id: 'game-waiting',
            status: 'waiting',
            updatedAt: new Date('2026-02-27T18:30:00.000Z'),
            players: [
              {
                user: { bot: null },
              },
            ],
          },
        ],
      },
      {
        id: 'lobby-playing',
        code: 'PLAY1',
        games: [
          {
            id: 'game-playing',
            status: 'playing',
            updatedAt: new Date('2026-02-27T17:30:00.000Z'),
            players: [
              {
                user: { bot: null },
              },
            ],
          },
        ],
      },
    ] as any)
    mockPrisma.games.updateMany
      .mockResolvedValueOnce({ count: 1 } as any)
      .mockResolvedValueOnce({ count: 1 } as any)
      .mockResolvedValueOnce({ count: 0 } as any)
      .mockResolvedValueOnce({ count: 0 } as any)
    mockPrisma.lobbies.updateMany
      .mockResolvedValueOnce({ count: 2 } as any)
      .mockResolvedValueOnce({ count: 0 } as any)

    const result = await cleanupStaleLobbiesAndGames({
      now,
      waitingStaleHours: 1,
      playingStaleHours: 2,
    })

    expect(result.scannedLobbies).toBe(2)
    expect(result.scannedActiveGames).toBe(2)
    expect(result.cancelledWaitingGames).toBe(1)
    expect(result.abandonedPlayingGames).toBe(1)
    expect(result.deactivatedLobbies).toBe(2)

    expect(mockPrisma.games.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['game-waiting'] },
          status: 'waiting',
        }),
        data: { status: 'cancelled' },
      })
    )

    expect(mockPrisma.games.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['game-playing'] },
          status: 'playing',
        }),
        data: expect.objectContaining({
          status: 'abandoned',
          abandonedAt: now,
        }),
      })
    )
  })

  it('finalizes stale games globally even when per-lobby scan is empty', async () => {
    mockPrisma.lobbies.findMany.mockResolvedValue([] as any)
    mockPrisma.games.updateMany
      .mockResolvedValueOnce({ count: 2 } as any)
      .mockResolvedValueOnce({ count: 3 } as any)
    mockPrisma.lobbies.updateMany.mockResolvedValueOnce({ count: 4 } as any)

    const result = await cleanupStaleLobbiesAndGames({
      now: new Date('2026-02-27T21:00:00.000Z'),
      waitingStaleHours: 1,
      playingStaleHours: 2,
    })

    expect(result.scannedLobbies).toBe(0)
    expect(result.scannedActiveGames).toBe(0)
    expect(result.cancelledWaitingGames).toBe(2)
    expect(result.abandonedPlayingGames).toBe(3)
    expect(result.deactivatedLobbies).toBe(4)

    expect(mockPrisma.games.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'waiting',
        }),
        data: expect.objectContaining({
          status: 'cancelled',
        }),
      })
    )

    expect(mockPrisma.games.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'playing',
        }),
        data: expect.objectContaining({
          status: 'abandoned',
        }),
      })
    )
  })
})

describe('sweepStaleLobbiesIfDue (#806)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.lobbies.findMany.mockResolvedValue([])
  })

  it('sweeps once and then throttles, so a busy list does not sweep per request', async () => {
    // The scheduled sweep runs on a GitHub cron asking for every five minutes
    // that in practice fired five times in a day, so the read path settles
    // staleness itself — but it must not do so on every single request.
    await sweepStaleLobbiesIfDue()
    const afterFirst = mockPrisma.lobbies.findMany.mock.calls.length
    expect(afterFirst).toBeGreaterThan(0)

    await sweepStaleLobbiesIfDue()
    await sweepStaleLobbiesIfDue()
    expect(mockPrisma.lobbies.findMany.mock.calls.length).toBe(afterFirst)
  })

  it('swallows a janitor failure rather than breaking the page it runs under', async () => {
    jest.advanceTimersByTime?.(0)
    mockPrisma.lobbies.findMany.mockRejectedValue(new Error('db down'))
    await expect(sweepStaleLobbiesIfDue()).resolves.toBeUndefined()
  })
})
