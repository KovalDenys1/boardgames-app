/**
 * Guards the read path. persistChatMessage stores a JSON string, but the Upstash
 * REST client deserializes JSON on the way out, so lrange hands back objects.
 * The old code called JSON.parse on them, threw, dropped every entry and
 * returned an empty list — chat history never worked, even with Redis connected
 * (#854). And #801 had made that empty list the only way a message could reach
 * anyone, which is #852.
 */

const lrange = jest.fn()

jest.mock('@upstash/redis', () => ({
  Redis: class {
    lpush = jest.fn()
    ltrim = jest.fn()
    expire = jest.fn()
    lrange = lrange
  },
}))

jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }))

const message = (text: string) => ({
  id: `id-${text}`,
  userId: 'u1',
  username: 'Ann',
  message: text,
  lobbyCode: '1234',
  timestamp: 1,
})

describe('getChatHistory', () => {
  beforeEach(() => {
    jest.resetModules()
    lrange.mockReset()
    process.env.KV_REST_API_URL = 'https://example.upstash.io'
    process.env.KV_REST_API_TOKEN = 'token'
  })

  it('reads entries the client already deserialized into objects', async () => {
    lrange.mockResolvedValue([message('second'), message('first')])
    const { getChatHistory } = await import('@/lib/chat-history')

    const history = await getChatHistory('1234')

    // Stored newest-first, returned chronologically.
    expect(history.map((m) => m.message)).toEqual(['first', 'second'])
  })

  it('still reads entries that come back as JSON strings', async () => {
    lrange.mockResolvedValue([JSON.stringify(message('only'))])
    const { getChatHistory } = await import('@/lib/chat-history')

    expect((await getChatHistory('1234')).map((m) => m.message)).toEqual(['only'])
  })

  it('drops entries it cannot make sense of, without losing the rest', async () => {
    lrange.mockResolvedValue([message('good'), 'not json at all', null, 42])
    const { getChatHistory } = await import('@/lib/chat-history')

    expect((await getChatHistory('1234')).map((m) => m.message)).toEqual(['good'])
  })

  it('returns nothing when no Redis is configured', async () => {
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
    const { getChatHistory } = await import('@/lib/chat-history')

    expect(await getChatHistory('1234')).toEqual([])
  })
})
