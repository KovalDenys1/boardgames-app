/**
 * Clear the rate-limit counters this machine's test runs produce.
 *
 * Rate limiting became a *shared* store the moment Redis was connected (#854),
 * which is the whole point — but it also means a suite that creates a lobby per
 * test now exhausts the create limit after a couple of runs and stays locked out
 * for the rest of the window. Before, the counters lived in the dev server's
 * memory and a restart forgave everything.
 *
 * Only loopback keys are touched. The limiter keys on the client IP taken from
 * x-real-ip or the rightmost x-forwarded-for (see lib/rate-limit.ts); behind
 * Vercel that is always a real address. `::1` and `127.0.0.1` can only come
 * from a request made on this machine, and `unknown` only from one with neither
 * header — so this cannot reach a real user's counters.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import { Redis } from '@upstash/redis'
import { getRedisRestCredentials } from '@/lib/redis-credentials'

// Nothing else in this process loads the environment — lib/db.ts is what
// normally does it, and this script deliberately does not import Prisma.
for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file)
  if (existsSync(path)) dotenv.config({ path, override: false, quiet: true })
}

async function main() {
  const credentials = getRedisRestCredentials()
  if (!credentials) {
    console.log('e2e: no Redis configured, nothing to reset')
    return
  }

  const redis = new Redis(credentials)
  const LOCAL_CLIENTS = ['::1', '127.0.0.1', 'unknown']
  let removed = 0

  for (const client of LOCAL_CLIENTS) {
    let cursor = '0'
    do {
      const [next, keys] = await redis.scan(cursor, {
        match: `rate_limit:${client}:*`,
        count: 200,
      })
      cursor = String(next)
      if (keys.length > 0) {
        await redis.del(...keys)
        removed += keys.length
      }
    } while (cursor !== '0')
  }

  console.log(`e2e: cleared ${removed} local rate-limit ${removed === 1 ? 'key' : 'keys'}`)
}

main().catch((error) => {
  console.warn('e2e: could not clear rate-limit keys —', error)
})
