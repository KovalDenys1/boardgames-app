'use client'

import { fetchWithGuest } from '@/lib/fetch-with-guest'
import { clientLogger } from '@/lib/client-logger'

const MAX_ATTEMPTS = 3

/**
 * Ask the server which realtime topic this lobby talks on (#845).
 *
 * The name carries a per-lobby secret, so it cannot be composed on the client
 * and the endpoint applies the lobby's own membership check before handing it
 * over. Failure means no realtime at all, and nothing on screen would say so,
 * so a transient error is worth retrying — but a 403 or 404 is an answer, not a
 * hiccup, and retrying those only delays the silence.
 */
export async function fetchLobbyTopic(
  code: string,
  isCancelled: () => boolean = () => false
): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (isCancelled()) return null

    try {
      const res = await fetchWithGuest(`/api/lobby/${code}/realtime-topic`)
      if (res.ok) {
        const data = await res.json()
        if (typeof data?.topic === 'string') return data.topic
      } else if (res.status === 403) {
        // Not a member — but possibly a spectator, and the spectate view mounts
        // the real game component, which opens its own connection through this
        // hook (#862). Asking again as a spectator is not a way around the
        // membership check: the spectate endpoint applies its own
        // allowSpectators, password and limit gates before it parts with the
        // name.
        return await fetchTopicAsSpectator(code, isCancelled)
      } else if (res.status === 401 || res.status === 404) {
        return null
      }
    } catch {
      // Network hiccup — fall through to the backoff below.
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
  }

  if (!isCancelled()) {
    clientLogger.warn('⚠️ Could not resolve the lobby realtime topic; realtime is off')
  }
  return null
}

/**
 * The spectator's way of earning the same topic name.
 *
 * GET /api/lobby/[code]/spectate returns `realtimeTopic` alongside the
 * snapshot, but only after it has decided the caller may watch at all. A lobby
 * with spectators switched off, one behind a password, or one already at its
 * spectator limit answers 403 here exactly as it does over the rest of the
 * spectate path.
 */
async function fetchTopicAsSpectator(
  code: string,
  isCancelled: () => boolean
): Promise<string | null> {
  if (isCancelled()) return null

  try {
    const res = await fetchWithGuest(`/api/lobby/${code}/spectate`)
    if (!res.ok) return null

    const data = await res.json()
    return typeof data?.realtimeTopic === 'string' ? data.realtimeTopic : null
  } catch {
    return null
  }
}
