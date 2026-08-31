// @ts-nocheck
import { act, render, screen, waitFor } from '@testing-library/react'
import AliasLobbyPage from '@/app/lobby/[code]/alias-page'
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
    data: { user: { id: 'user-1' } },
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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts) return `${key}:${JSON.stringify(opts)}`
      return key
    },
  }),
}))

jest.mock('@/lib/i18n-toast', () => ({
  showToast: {
    error: jest.fn(),
    errorFrom: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('@/lib/fetch-with-guest', () => ({
  fetchWithGuest: jest.fn(),
}))

jest.mock('@/lib/client-logger', () => ({
  clientLogger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

jest.mock('@/lib/lobby-create-metrics', () => ({
  finalizePendingLobbyCreateMetric: jest.fn(),
}))

jest.mock('@/lib/analytics', () => ({
  trackMoveSubmitApplied: jest.fn(),
}))

jest.mock('@/components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner" />,
}))

jest.mock('@/components/ReactionOverlay', () => ({
  __esModule: true,
  default: () => null,
  // alias-page imports the named export, and only renders it once the game is
  // active — the waiting-room tests never hit it, the #770 test does.
  ReactionOverlay: () => null,
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
      gameType: 'alias',
      creatorId: 'user-1',
      name: 'Test Lobby',
      isActive: true,
      turnTimer: 60,
    },
    activeGame: {
      id: 'game-1',
      status: 'waiting',
      state: {
        status: 'waiting',
        currentPlayerIndex: 0,
        players: [],
        data: {
          phase: 'team_assignment',
          teams: [
            { id: 'team-1', name: 'Team 1', playerIds: [], score: 0, describerIndex: 0 },
            { id: 'team-2', name: 'Team 2', playerIds: [], score: 0, describerIndex: 0 },
          ],
          currentTeamIndex: 0,
          turnsPerTeam: 3,
          skipPenalty: -1,
          currentCard: null,
          currentCardIndex: 0,
          currentCardResults: [],
          turnStartedAt: null,
          teamTurnCounts: { 'team-1': 0, 'team-2': 0 },
          lastTurnResult: null,
          usedWordIndices: [],
          winnerId: null,
        },
      },
      players: [
        { id: 'player-1', userId: 'user-1', name: 'Alice', user: { username: 'Alice' } },
        { id: 'player-2', userId: 'user-2', name: 'Bob', user: { username: 'Bob' } },
        { id: 'player-3', userId: 'user-3', name: 'Carol', user: { username: 'Carol' } },
        { id: 'player-4', userId: 'user-4', name: 'Dave', user: { username: 'Dave' } },
      ],
    },
  }
}

describe('AliasLobbyPage', () => {
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

  it('renders the waiting room team assignment screen', async () => {
    render(<AliasLobbyPage code="ABCD" />)
    await waitFor(() => expect(screen.getByTestId('alias-waiting-room')).toBeTruthy())
  })

  it('shows the try-bot-games banner in the waiting phase when below min players (#780)', async () => {
    const response = buildLobbyResponse()
    response.activeGame.state.data.phase = 'waiting'
    response.activeGame.players = [
      { id: 'player-1', userId: 'user-1', name: 'Alice', user: { username: 'Alice' } },
    ]
    ;(response.activeGame as Record<string, unknown>).createdAt = new Date(Date.now() - 2 * 60_000).toISOString()
    mockFetchWithGuest.mockResolvedValue({
      ok: true,
      json: async () => response,
    } as Response)

    render(<AliasLobbyPage code="ABCD" onGameReset={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('game.ui.tryBotGamesTitle')).toBeInTheDocument()
    })
  })

  it('redirects away when a game-abandoned broadcast is received', async () => {
    render(<AliasLobbyPage code="ABCD" />)
    await waitFor(() => expect(screen.getByTestId('alias-waiting-room')).toBeTruthy())

    act(() => {
      broadcastHandlers['game-abandoned']?.({
        payload: { gameId: 'game-1', reason: 'insufficient_players' },
      })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'lobby.gameAbandoned',
        undefined,
        undefined,
        { id: 'alias-lifecycle-redirect' }
      )
      expect(mockReplace).toHaveBeenCalledWith('/games')
    })
  })

  it('redirects when a player-left broadcast drops below the minimum player count', async () => {
    render(<AliasLobbyPage code="ABCD" />)
    await waitFor(() => expect(screen.getByTestId('alias-waiting-room')).toBeTruthy())

    act(() => {
      broadcastHandlers['player-left']?.({
        payload: { userId: 'user-4', username: 'Dave', remainingPlayers: 3 },
      })
    })

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('toast.playerLeft', undefined, { player: 'Dave' })
      expect(mockReplace).toHaveBeenCalledWith('/games')
    })
  })
})

// #770 — the turn timer effect used to call clearInterval(id) from a
// synchronous first tick(), before `const id = setInterval(...)` on the next
// line was initialized. Opening a lobby whose turn had already expired hit
// that branch immediately and threw "ReferenceError: Cannot access 'i' before
// initialization" (73 Sentry events), killing the page via the error boundary.
describe('AliasLobbyPage turn timer with an already-expired turn (#770)', () => {
  const mockFetchWithGuest = fetchWithGuest as jest.MockedFunction<typeof fetchWithGuest>

  function buildExpiredTurnResponse() {
    const base = buildLobbyResponse()
    base.activeGame.status = 'playing'
    base.activeGame.state.status = 'playing'
    base.activeGame.state.data.phase = 'turn_active'
    // Turn started well beyond the 60s turnTimer → first tick computes r === 0
    base.activeGame.state.data.turnStartedAt = Date.now() - 10 * 60 * 1000
    base.activeGame.state.data.currentCard = { word: 'apple', taboo: [] }
    base.activeGame.state.data.teams[0].playerIds = ['user-1', 'user-2']
    base.activeGame.state.data.teams[1].playerIds = ['user-3', 'user-4']
    base.activeGame.state.players = [
      { id: 'user-1', name: 'Alice' },
      { id: 'user-2', name: 'Bob' },
      { id: 'user-3', name: 'Carol' },
      { id: 'user-4', name: 'Dave' },
    ]
    return base
  }

  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(broadcastHandlers).forEach((key) => delete broadcastHandlers[key])
    mockFetchWithGuest.mockResolvedValue({
      ok: true,
      json: async () => buildExpiredTurnResponse(),
    } as Response)
  })

  it('mounts without throwing a ReferenceError', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AliasLobbyPage code="ABCD" />)).not.toThrow()

    // Let the lobby fetch resolve and the timer effect run its first tick.
    await waitFor(() => expect(mockFetchWithGuest).toHaveBeenCalled())

    const sawTdzError = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('before initialization'))
    )
    expect(sawTdzError).toBe(false)

    errorSpy.mockRestore()
  })
})
