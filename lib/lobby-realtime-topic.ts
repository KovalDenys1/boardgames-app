/**
 * Names the Supabase Realtime broadcast topic a lobby talks on.
 *
 * The topic used to be `lobby:{code}`, and lobby codes are four digits, so
 * anyone could subscribe to any lobby by enumerating ten thousand names. Two
 * things rode on that: Alias broadcasts guess text client-to-client, so it never
 * passes through a server that could withhold it, and a lobby with
 * `allowSpectators: false` refused outsiders over HTTP while its game state
 * still went out on the open topic (#845).
 *
 * The name now carries a random per-lobby secret. Enumerating codes buys
 * nothing: the secret is handed out only by
 * GET /api/lobby/[code]/realtime-topic, which applies the same membership check
 * as the rest of the lobby API.
 *
 * Both sides build the name here so they cannot drift apart — a mismatch would
 * not raise an error, it would just silently deliver nothing.
 */

export function buildLobbyTopic(code: string, realtimeSecret: string): string {
  return `lobby:${code}:${realtimeSecret}`
}
