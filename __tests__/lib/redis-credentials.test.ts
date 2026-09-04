import { getRedisRestCredentials } from '@/lib/redis-credentials'

/**
 * Two naming schemes, and reading only one of them is what made chat history
 * always empty and rate limiting per-instance in production (#854). Connecting
 * Upstash through the Vercel Marketplace sets KV_REST_API_*; connecting it
 * directly sets UPSTASH_REDIS_REST_*.
 */
describe('getRedisRestCredentials', () => {
  const saved = { ...process.env }

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
  })

  afterAll(() => {
    process.env = saved
  })

  it('reads the names a direct Upstash setup uses', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://direct.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'direct-token'

    expect(getRedisRestCredentials()).toEqual({
      url: 'https://direct.upstash.io',
      token: 'direct-token',
    })
  })

  it('reads the names the Vercel Marketplace integration sets', () => {
    process.env.KV_REST_API_URL = 'https://marketplace.upstash.io'
    process.env.KV_REST_API_TOKEN = 'marketplace-token'

    expect(getRedisRestCredentials()).toEqual({
      url: 'https://marketplace.upstash.io',
      token: 'marketplace-token',
    })
  })

  it('prefers the explicit Upstash names when both are present', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://direct.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'direct-token'
    process.env.KV_REST_API_URL = 'https://marketplace.upstash.io'
    process.env.KV_REST_API_TOKEN = 'marketplace-token'

    expect(getRedisRestCredentials()?.url).toBe('https://direct.upstash.io')
  })

  it('returns null rather than half a credential', () => {
    process.env.KV_REST_API_URL = 'https://marketplace.upstash.io'

    expect(getRedisRestCredentials()).toBeNull()
  })
})
