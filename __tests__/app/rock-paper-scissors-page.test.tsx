// @ts-nocheck
import { act, render, screen, waitFor } from '@testing-library/react'
import RockPaperScissorsLobbyPage from '@/app/lobby/[code]/rock-paper-scissors-page'
import { fetchWithGuest } from '@/lib/fetch-with-guest'
import { showToast } from '@/lib/i18n-toast'

const mockReplace = jest.fn()
const mockPush = jest.fn()
const mockPrefetch = jest.fn()

const broadcastHandlers: Record<string, (data: { payload: unknown }) => void> = {}
const mockChannel: any = {
  on: jest.fn((type: string, filter: { event?: string }, handler: (data: unknown) => void) => {
    if (type === 'broadcast' && filter.event) {
      broadcastHandlers[filter.event] = handler as any
    }
    return mockChannel
  }),
  subscribe: jest.fn(() => mockChannel),
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    prefetch: mockPrefetch,
  }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
      },
    },
    status: 'authenticated',
  }),
}))

jest.mock('@/contexts/GuestContext', () => ({
  useGuest: () => ({
    isGuest: false,
    guestToken: null,
    guestId: null,
    guestName: null,
  }),
}))

jest.mock('@/lib/i18n-helpers', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@/lib/i18n-toast', () => ({
  showToast: {
    error: jest.fn(),
    errorFrom: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    infoText: jest.fn(),
  },
}))

jest.mock('@/lib/fetch-with-guest', () => ({
  fetchWithGuest: jest.fn(),
}))

jest.mock('@/lib/client-logger', () => ({
  clientLogger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/lobby-create-metrics', () => ({
  finalizePendingLobbyCreateMetric: jest.fn(),
}))

jest.mock('@/lib/analytics', () => ({
  trackLobbyLeaveRedirect: jest.fn(),
  trackMoveSubmitApplied: jest.fn(),
}))

jest.mock('@/components/RockPaperScissorsGameBoard', () => ({
  __esModule: true,
  default: () => <div data-testid="rps-board" />,
  WinPips: () => null,
  getChoiceEmoji: () => '❔',
  CHOICE_LABEL_KEY: { rock: 'lobby.choice.rock', paper: 'lobby.choice.paper', scissors: 'lobby.choice.scissors' },
}))

jest.mock('@/components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner" />,
}))

jest.mock('@/components/ConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}))

// The realtime topic carries a per-lobby secret and is fetched from the server
// (#845). Supabase itself is mocked below, so the name only has to be stable.
jest.mock('@/lib/lobby-realtime-topic-client', () => ({
  fetchLobbyTopic: jest.fn(async (code: string) => `lobby:${code}:test-secret`),
}))

jest.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: jest.fn(() => ({
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn().mockResolvedValue({}),
  })),
}))

function buildLobbyResponse() {
  return {
    lobby: {
      id: 'lobby-1',
      code: 'ABCD',
      gameType: 'rock_paper_scissors',
      creatorId: 'user-1',
      name: 'Lobby',
      isActive: true,
    },
    activeGame: {
      id: 'game-1',
      gameType: 'rock_paper_scissors',
      status: 'playing',
      currentPlayerIndex: 0,
      state: {
        status: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ],
        data: {
          mode: 'best-of-3',
          rounds: [],
          playerChoices: {},
          scores: {},
          playersReady: [],
          gameWinner: null,
        },
      },
      players: [
        {
          id: 'player-1',
          userId: 'user-1',
          name: 'Alice',
          user: {
            username: 'Alice',
          },
        },
        {
          id: 'player-2',
          userId: 'user-2',
          name: 'Bob',
          user: {
            username: 'Bob',
          },
        },
      ],
    },
  }
}

describe('RockPaperScissorsLobbyPage', () => {
  const mockFetchWithGuest = fetchWithGuest as jest.MockedFunction<typeof fetchWithGuest>
  const toast = showToast as jest.Mocked<typeof showToast>

  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(broadcastHandlers).forEach((key) => delete broadcastHandlers[key])
    mockFetchWithGuest.mockResolvedValue({
      ok: true,
      json: async () => buildLobbyResponse(),
    } as Response)
  })

  it('redirects away when a game-abandoned broadcast is received', async () => {
    render(<RockPaperScissorsLobbyPage code="ABCD" />)

    await waitFor(() => expect(screen.getAllByTestId('rps-board').length).toBeGreaterThan(0))

    act(() => {
      broadcastHandlers['game-abandoned']?.({
        payload: {
          gameId: 'game-1',
          reason: 'insufficient_players',
        },
      })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'lobby.gameAbandoned',
        undefined,
        undefined,
        { id: 'rps-lifecycle-redirect' }
      )
      expect(mockReplace).toHaveBeenCalledWith('/games')
    })
  })

  it('redirects away when a player-left broadcast drops below the minimum player count', async () => {
    render(<RockPaperScissorsLobbyPage code="ABCD" />)

    await waitFor(() => expect(screen.getAllByTestId('rps-board').length).toBeGreaterThan(0))

    act(() => {
      broadcastHandlers['player-left']?.({
        payload: {
          userId: 'user-2',
          username: 'Bob',
          remainingPlayers: 1,
        },
      })
    })

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'toast.playerLeft',
        undefined,
        { player: 'Bob' }
      )
      expect(mockReplace).toHaveBeenCalledWith('/games')
    })
  })
})
