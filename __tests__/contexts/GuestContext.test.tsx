import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { GuestProvider, useGuest } from '@/contexts/GuestContext'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

const GUEST_ID_KEY = 'boardly_guest_id'
const GUEST_NAME_KEY = 'boardly_guest_name'
const GUEST_TOKEN_KEY = 'boardly_guest_token'

describe('GuestContext', () => {
  const originalFetch = global.fetch
  const mockFetch = jest.fn()

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GuestProvider>{children}</GuestProvider>
  )

  const setSessionStatus = (status: 'authenticated' | 'unauthenticated' | 'loading') => {
    mockUseSession.mockReturnValue({
      data: status === 'authenticated' ? ({ user: { id: 'user-1' } } as any) : null,
      status,
      update: jest.fn(),
    } as any)
  }

  beforeAll(() => {
    ;(global as any).fetch = mockFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    setSessionStatus('unauthenticated')
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        guestId: 'guest-new',
        guestName: 'Guest User',
        guestToken: 'guest.jwt.token',
      }),
    })
  })

  afterAll(() => {
    ;(global as any).fetch = originalFetch
  })

  it('initializes with no guest data', () => {
    const { result } = renderHook(() => useGuest(), { wrapper })

    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestId).toBeNull()
    expect(result.current.guestName).toBeNull()
    expect(result.current.guestToken).toBeNull()
  })

  it('loads guest data from localStorage and refreshes token', async () => {
    window.localStorage.setItem(GUEST_ID_KEY, 'guest-1')
    window.localStorage.setItem(GUEST_NAME_KEY, 'Stored Guest')
    window.localStorage.setItem(GUEST_TOKEN_KEY, 'stored.token')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        guestId: 'guest-1',
        guestName: 'Stored Guest',
        guestToken: 'refreshed.token',
      }),
    })

    const { result } = renderHook(() => useGuest(), { wrapper })

    await waitFor(() => {
      expect(result.current.isGuest).toBe(true)
    })

    await waitFor(() => {
      expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBe('refreshed.token')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/guest-session', expect.any(Object))
  })

  it('creates guest session via setGuestMode and persists it', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        guestId: 'guest-42',
        guestName: 'New Guest',
        guestToken: 'token-42',
      }),
    })

    const { result } = renderHook(() => useGuest(), { wrapper })

    await act(async () => {
      await result.current.setGuestMode('New Guest')
    })

    expect(result.current.isGuest).toBe(true)
    expect(result.current.guestId).toBe('guest-42')
    expect(result.current.guestName).toBe('New Guest')
    expect(result.current.guestToken).toBe('token-42')

    expect(window.localStorage.getItem(GUEST_ID_KEY)).toBe('guest-42')
    expect(window.localStorage.getItem(GUEST_NAME_KEY)).toBe('New Guest')
    expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBe('token-42')
  })

  it('returns token header from getHeaders in guest mode', async () => {
    const { result } = renderHook(() => useGuest(), { wrapper })

    await act(async () => {
      await result.current.setGuestMode('Header Guest', {
        guestId: 'guest-header',
        guestToken: 'header.token',
      })
    })

    expect(result.current.getHeaders()).toEqual({
      'X-Guest-Token': 'header.token',
    })
  })

  it('clears guest mode and local storage', async () => {
    const { result } = renderHook(() => useGuest(), { wrapper })

    await act(async () => {
      await result.current.setGuestMode('Clear Guest', {
        guestId: 'guest-clear',
        guestToken: 'clear.token',
      })
    })

    act(() => {
      result.current.clearGuestMode()
    })

    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestId).toBeNull()
    expect(result.current.guestName).toBeNull()
    expect(result.current.guestToken).toBeNull()

    expect(window.localStorage.getItem(GUEST_ID_KEY)).toBeNull()
    expect(window.localStorage.getItem(GUEST_NAME_KEY)).toBeNull()
    expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBeNull()
  })

  it('throws when useGuest is called outside provider', () => {
    const originalError = console.error
    console.error = jest.fn()

    expect(() => renderHook(() => useGuest())).toThrow('useGuest must be used within a GuestProvider')

    console.error = originalError
  })
})

// #769 — in embedded WebViews window.localStorage is null, and in Safari
// private mode touching it throws SecurityError. Either used to crash the
// provider on mount, and since GuestProvider wraps the whole app that took
// down every route.
describe('GuestContext with unusable localStorage (#769)', () => {
  const realLocalStorage = window.localStorage
  const mockFetch = jest.fn()

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GuestProvider>{children}</GuestProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).fetch = mockFetch
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(useSession as jest.MockedFunction<typeof useSession>).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    } as any)
  })

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: realLocalStorage,
      writable: true,
      configurable: true,
    })
  })

  it('mounts without throwing when localStorage is null', () => {
    Object.defineProperty(window, 'localStorage', {
      value: null,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useGuest(), { wrapper })

    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestId).toBeNull()
  })

  it('mounts without throwing when localStorage access throws SecurityError', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })

    const { result } = renderHook(() => useGuest(), { wrapper })

    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestName).toBeNull()
  })
})

describe('a failed session refresh on page load (#856)', () => {
  const originalFetch = global.fetch
  const mockFetch = jest.fn()

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GuestProvider>{children}</GuestProvider>
  )

  beforeAll(() => {
    ;(global as any).fetch = mockFetch
  })

  afterAll(() => {
    ;(global as any).fetch = originalFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() } as any)
    window.localStorage.setItem(GUEST_ID_KEY, 'guest-stored')
    window.localStorage.setItem(GUEST_NAME_KEY, 'Stored Guest')
    window.localStorage.setItem(GUEST_TOKEN_KEY, 'stored.jwt.token')
  })

  const failWith = (status: number, error = 'nope') => {
    mockFetch.mockResolvedValue({ ok: false, status, json: async () => ({ error }) })
  }

  it('keeps the identity when the refresh is rate limited', async () => {
    // /api/auth/guest-session allows five requests per fifteen minutes per IP,
    // and everyone behind one NAT shares that address. A 429 says nothing about
    // whether this guest is real.
    failWith(429, 'Too many requests')

    renderHook(() => useGuest(), { wrapper })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    await waitFor(() => {
      expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBe('stored.jwt.token')
    })
    expect(window.localStorage.getItem(GUEST_ID_KEY)).toBe('guest-stored')
  })

  it('keeps the identity when the request never arrives', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))

    renderHook(() => useGuest(), { wrapper })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    await waitFor(() => {
      expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBe('stored.jwt.token')
    })
  })

  it('keeps the identity when the server is broken', async () => {
    failWith(500, 'Internal error')

    renderHook(() => useGuest(), { wrapper })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    await waitFor(() => {
      expect(window.localStorage.getItem(GUEST_ID_KEY)).toBe('guest-stored')
    })
  })

  it('drops the identity when the stored name is the problem', async () => {
    // 409 is "that username is taken" — the stored name genuinely cannot be
    // used again, so keeping it would loop forever.
    failWith(409, 'Username is already taken')

    renderHook(() => useGuest(), { wrapper })

    await waitFor(() => {
      expect(window.localStorage.getItem(GUEST_TOKEN_KEY)).toBeNull()
    })
    expect(window.localStorage.getItem(GUEST_ID_KEY)).toBeNull()
  })
})
