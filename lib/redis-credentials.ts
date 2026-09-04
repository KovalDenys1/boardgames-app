/**
 * Where the Upstash REST credentials come from.
 *
 * Two naming schemes are in play and the difference is not cosmetic. Connecting
 * Upstash through the Vercel Marketplace sets `KV_REST_API_URL` and
 * `KV_REST_API_TOKEN`; connecting Upstash directly sets
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The code read only
 * the second pair, production had only the first, and both callers are written
 * to degrade quietly when no credentials are found — so chat history returned
 * an empty list forever and rate limiting silently became per-instance
 * counters. #801 then made that empty list the only way a chat message could
 * reach anyone (#852, #854).
 *
 * Reading both is the whole fix. It is here rather than duplicated in the two
 * callers so the next place that wants Redis cannot pick just one of them.
 */

export interface RedisRestCredentials {
  url: string
  token: string
}

export function getRedisRestCredentials(): RedisRestCredentials | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

  if (!url || !token) return null
  return { url, token }
}

/** What to tell someone whose Redis is missing, naming both accepted spellings. */
export const REDIS_CREDENTIALS_MISSING_MESSAGE =
  'No Redis credentials found. Set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, ' +
  'or connect Upstash through the Vercel Marketplace, which sets ' +
  'KV_REST_API_URL / KV_REST_API_TOKEN.'
