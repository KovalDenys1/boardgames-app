/**
 * Server-side Supabase helpers for use in Next.js API routes.
 * Uses the REST Broadcast API — stateless, no persistent WebSocket from the server.
 */

import { prisma } from '@/lib/db'
import { buildLobbyTopic } from '@/lib/lobby-realtime-topic'

const BROADCAST_TIMEOUT_MS = 3000

async function broadcastToChannel(
  topic: string,
  event: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return false

  try {
    const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        messages: [{ topic, event, payload }],
      }),
      signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Broadcast an event to all subscribers on a lobby channel.
 *
 * The topic name carries the lobby's realtime secret (#845), which is why this
 * reads the lobby rather than composing the name from the code alone. Callers
 * are unchanged: they still pass the code, and a lobby that no longer exists
 * simply broadcasts nothing, which is what used to happen anyway once every
 * subscriber had left.
 */
export async function broadcastToLobby(
  lobbyCode: string,
  event: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  // Broadcasting is fire-and-forget at almost every call site, so this must
  // behave the way it did before it touched the database: fail quietly and
  // return false, never reject into an unhandled promise.
  let lobby: { realtimeSecret: string } | null = null
  try {
    lobby = await prisma.lobbies.findUnique({
      where: { code: lobbyCode },
      select: { realtimeSecret: true },
    })
  } catch {
    return false
  }
  if (!lobby) return false

  return broadcastToChannel(buildLobbyTopic(lobbyCode, lobby.realtimeSecret), event, payload)
}

/** Broadcast an event to a specific user's channel (`user:{userId}`). */
export async function broadcastToUser(
  userId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  return broadcastToChannel(`user:${userId}`, event, payload)
}
