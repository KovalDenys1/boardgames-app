// @ts-nocheck

jest.mock('@/lib/db', () => ({
  prisma: {
    gameStateSnapshots: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  apiLogger: jest.fn(() => ({
    warn: jest.fn(),
  })),
}))

import { prisma } from '@/lib/db'
import { appendGameReplaySnapshot, decodeGameReplaySnapshots } from '@/lib/game-replay'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('game replay helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('compresses replay state asynchronously and keeps snapshots decodable', async () => {
    mockPrisma.gameStateSnapshots.findFirst.mockResolvedValue({ turnNumber: 2 })
    mockPrisma.gameStateSnapshots.create.mockResolvedValue({ id: 'snapshot-3' })

    await appendGameReplaySnapshot({
      gameId: 'game-1',
      actionType: 'move:submit',
      actionPayload: { cell: 4 },
      state: {
        gameType: 'tic_tac_toe',
        board: ['X', null, 'O'],
        currentPlayerIndex: 1,
      },
    })

    expect(mockPrisma.gameStateSnapshots.findFirst).toHaveBeenCalledTimes(1)
    expect(mockPrisma.gameStateSnapshots.create).toHaveBeenCalledTimes(1)

    const createArgs = mockPrisma.gameStateSnapshots.create.mock.calls[0][0]
    expect(createArgs.data.turnNumber).toBe(3)
    expect(createArgs.data.stateEncoding).toBe('gzip-base64')
    expect(createArgs.data.stateSize).toBeGreaterThan(0)
    expect(typeof createArgs.data.stateCompressed).toBe('string')
    expect(createArgs.data.stateCompressed).not.toContain('"board"')

    const decoded = decodeGameReplaySnapshots([
      {
        id: 'snapshot-3',
        turnNumber: createArgs.data.turnNumber,
        playerId: null,
        actionType: 'move:submit',
        actionPayload: { cell: 4 },
        stateCompressed: createArgs.data.stateCompressed,
        stateEncoding: createArgs.data.stateEncoding,
        createdAt: new Date('2026-03-09T12:00:00.000Z'),
      },
    ])

    expect(decoded[0]).toMatchObject({
      id: 'snapshot-3',
      actionType: 'move:submit',
      state: {
        gameType: 'tic_tac_toe',
        board: ['X', null, 'O'],
        currentPlayerIndex: 1,
      },
    })
  })

  it('skips the findFirst lookup when the caller already knows the turn number', async () => {
    mockPrisma.gameStateSnapshots.create.mockResolvedValue({ id: 'snapshot-6' })

    await appendGameReplaySnapshot({
      gameId: 'game-1',
      turnNumber: 5,
      actionType: 'bot:place',
      state: { board: [] },
    })

    expect(mockPrisma.gameStateSnapshots.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.gameStateSnapshots.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.gameStateSnapshots.create.mock.calls[0][0].data.turnNumber).toBe(5)
  })
})
