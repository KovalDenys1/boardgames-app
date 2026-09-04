import { test as base, expect } from '@playwright/test'
import { clearLoopbackRateLimits } from './rate-limits'

/**
 * The `test` every spec should import.
 *
 * It clears this machine's rate-limit counters before each test rather than
 * once per run. Since #854 those counters are shared in Redis, so the suite
 * competes with itself: the auth preset allows five requests per fifteen
 * minutes and a spectator needs a guest of their own, which a full run exhausts
 * partway through. Clearing per test keeps a 429 meaning "the product limited
 * us", which is the only reading worth having.
 */
export const test = base.extend<{ freshRateLimits: void }>({
  freshRateLimits: [
    async ({}, use) => {
      await clearLoopbackRateLimits().catch(() => {
        // A run without Redis configured simply has nothing to clear.
      })
      await use()
    },
    { auto: true },
  ],
})

export { expect }
