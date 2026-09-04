import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { type APIRequestContext, type BrowserContext, type Browser } from '@playwright/test'
import { E2E_LOBBY_MARKER } from './marker'

/**
 * Setup helpers for the end-to-end tests.
 *
 * Lobbies and players are created over the API rather than by clicking through
 * the UI. Not to cut corners: the entry and lobby-creation screens carry almost
 * no test ids, so driving them would make every test fragile in a way that has
 * nothing to do with what is being tested. The browser is then pointed at the
 * finished lobby, and everything asserted from there happens in a real page
 * against real Supabase Realtime.
 */

export { E2E_LOBBY_MARKER } from './marker'

export interface Guest {
  guestId: string
  guestName: string
  guestToken: string
}

export interface E2ELobby {
  code: string
  host: Guest
}

/**
 * Where the host guest is remembered between runs.
 *
 * /api/auth/guest-session allows five requests per fifteen minutes, which a
 * couple of reruns would exhaust — and a suite that fails on its fourth run of
 * the afternoon teaches you to stop running it. A guest token is good for 12h,
 * so it is minted once and reused; if it has expired the create below gets a
 * 401 and mints a fresh one.
 */
const HOST_CACHE = path.join(__dirname, '..', '.auth', 'host.json')

function readCachedHost(): Guest | null {
  try {
    if (!existsSync(HOST_CACHE)) return null
    const parsed = JSON.parse(readFileSync(HOST_CACHE, 'utf8'))
    return typeof parsed?.guestToken === 'string' ? (parsed as Guest) : null
  } catch {
    return null
  }
}

function cacheHost(guest: Guest): void {
  mkdirSync(path.dirname(HOST_CACHE), { recursive: true })
  writeFileSync(HOST_CACHE, JSON.stringify(guest, null, 2))
}

function forgetCachedHost(): void {
  try {
    rmSync(HOST_CACHE, { force: true })
  } catch {
    // Nothing to forget.
  }
}

function uniqueName(prefix: string): string {
  // Guest names are capped at 20 characters.
  return `${prefix}${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Create a lobby owned by a fresh guest.
 *
 * Guests may create lobbies, and in development the origin-based CSRF check
 * passes for localhost, so an Origin header is all this needs.
 */
export async function createGuestLobby(
  request: APIRequestContext,
  gameType: string,
  baseURL: string,
  maxPlayers = 4
): Promise<E2ELobby> {
  let host = readCachedHost() ?? (await createGuest(request, baseURL))

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await request.post(`${baseURL}/api/lobby`, {
      headers: { Origin: baseURL, 'X-Guest-Token': host.guestToken },
      data: {
        name: `${E2E_LOBBY_MARKER} ${gameType}`,
        gameType,
        maxPlayers,
        turnTimer: 60,
        allowSpectators: false,
        theme: 'default',
      },
    })

    if (res.status() === 401 && attempt === 0) {
      // The cached token has expired. Mint one and try again.
      forgetCachedHost()
      host = await createGuest(request, baseURL)
      continue
    }

    if (!res.ok()) {
      throw new Error(`Could not create lobby: ${res.status()} ${await res.text()}`)
    }

    const body = await res.json()
    const code = body?.lobby?.code
    if (typeof code !== 'string') {
      throw new Error(`Lobby create returned no code: ${JSON.stringify(body)}`)
    }

    cacheHost(host)
    return { code, host }
  }

  throw new Error('Could not create a lobby even with a fresh guest token')
}

/**
 * A guest identity with no lobby yet.
 *
 * There is no standalone "create a guest" endpoint, so this borrows the
 * guest-session route the client itself uses.
 */
export async function createGuest(request: APIRequestContext, baseURL: string): Promise<Guest> {
  const guestName = uniqueName('E2E')
  const res = await request.post(`${baseURL}/api/auth/guest-session`, {
    headers: { Origin: baseURL },
    data: { guestName },
  })

  if (!res.ok()) {
    throw new Error(`Could not create a guest: ${res.status()} ${await res.text()}`)
  }

  const body = await res.json()
  const token = body?.guestToken ?? body?.token
  const id = body?.guestId ?? body?.id
  if (typeof token !== 'string' || typeof id !== 'string') {
    throw new Error(`Guest session returned no token: ${JSON.stringify(body)}`)
  }

  return { guestId: id, guestName: body?.guestName ?? guestName, guestToken: token }
}

/** Add another guest to an existing lobby. */
export async function joinAsGuest(
  request: APIRequestContext,
  code: string,
  baseURL: string
): Promise<Guest> {
  const guestName = uniqueName('E2E')
  const res = await request.post(`${baseURL}/api/lobby/${code}/join-guest`, {
    headers: { Origin: baseURL },
    data: { guestName },
  })

  if (!res.ok()) {
    throw new Error(`Guest could not join ${code}: ${res.status()} ${await res.text()}`)
  }

  const body = await res.json()
  if (typeof body?.guestToken !== 'string') {
    throw new Error(`Join returned no guest token: ${JSON.stringify(body)}`)
  }

  return { guestId: body.guestId, guestName: body.guestName, guestToken: body.guestToken }
}

/**
 * A browser context that is already signed in as this guest.
 *
 * The client reads guest identity from three localStorage keys (see
 * lib/client/fetch-with-guest.ts), so seeding those before the first navigation
 * is the whole of "log in as a guest". Each guest gets its own context, which
 * is the point — two tabs in one context would share storage and be the same
 * person, and then nothing about a second player could be tested at all.
 */
export async function contextForGuest(browser: Browser, guest: Guest): Promise<BrowserContext> {
  const context = await browser.newContext()
  await context.addInitScript((seed: Guest) => {
    window.localStorage.setItem('boardly_guest_token', seed.guestToken)
    window.localStorage.setItem('boardly_guest_id', seed.guestId)
    window.localStorage.setItem('boardly_guest_name', seed.guestName)
  }, guest)
  return context
}
