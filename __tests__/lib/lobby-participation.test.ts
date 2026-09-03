import { __participantKeyForTests } from '@/lib/lobby-participation'

jest.mock('@/lib/db', () => ({ prisma: { lobbyParticipations: { create: jest.fn() } } }))
jest.mock('@/lib/logger', () => ({
  apiLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}))

describe('participation key (#816)', () => {
  const OLD = process.env.PARTICIPATION_HASH_SALT

  beforeEach(() => { process.env.PARTICIPATION_HASH_SALT = 'test-salt' })
  afterAll(() => { process.env.PARTICIPATION_HASH_SALT = OLD })

  it('is stable for the same user, so a returning player can be counted once', () => {
    expect(__participantKeyForTests('user-1')).toBe(__participantKeyForTests('user-1'))
  })

  it('differs between users', () => {
    expect(__participantKeyForTests('user-1')).not.toBe(__participantKeyForTests('user-2'))
  })

  it('never contains the user id — the table must outlive the person, not identify them', () => {
    const key = __participantKeyForTests('guest-abc-123')
    expect(key).not.toContain('guest')
    expect(key).not.toContain('abc')
    expect(key).toMatch(/^[0-9a-f]{32}$/)
  })

  it('changes with the salt, so the hash cannot be reproduced without it', () => {
    const withTestSalt = __participantKeyForTests('user-1')
    process.env.PARTICIPATION_HASH_SALT = 'another-salt'
    expect(__participantKeyForTests('user-1')).not.toBe(withTestSalt)
  })
})
