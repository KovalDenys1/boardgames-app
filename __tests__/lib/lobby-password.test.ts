import {
  hashLobbyPassword,
  isHashedLobbyPassword,
  verifyLobbyPassword,
} from '@/lib/lobby-password'

describe('lib/lobby-password', () => {
  it('returns null hash for empty password input', async () => {
    await expect(hashLobbyPassword('   ')).resolves.toBeNull()
    await expect(hashLobbyPassword(undefined)).resolves.toBeNull()
  })

  it('rejects a stored password that is not a bcrypt hash (#721)', async () => {
    // The legacy plain-text comparison is gone: an unhashed stored value now
    // fails to match anything, so those rows can't keep working un-migrated.
    // Verified against production before removing it — the 64 remaining
    // plain-text rows all belonged to inactive lobbies.
    await expect(verifyLobbyPassword('legacy-secret', 'legacy-secret')).resolves.toBe(false)
    await expect(verifyLobbyPassword('legacy-secret', 'wrong')).resolves.toBe(false)
  })

  it('verifies bcrypt-hashed lobby password', async () => {
    const hashed = await hashLobbyPassword('secure-secret')

    expect(isHashedLobbyPassword(hashed)).toBe(true)
    await expect(verifyLobbyPassword(hashed, 'secure-secret')).resolves.toBe(true)
    await expect(verifyLobbyPassword(hashed, 'wrong-secret')).resolves.toBe(false)
  })

  it('treats missing stored password as open lobby', async () => {
    await expect(verifyLobbyPassword(null, undefined)).resolves.toBe(true)
  })
})
