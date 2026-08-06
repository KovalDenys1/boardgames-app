import { comparePassword, hashPassword } from '@/lib/auth'

const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/

function normalizeLobbyPassword(password: string | null | undefined): string | null {
  if (typeof password !== 'string') {
    return null
  }

  const normalized = password.trim()
  return normalized.length > 0 ? normalized : null
}

export function isHashedLobbyPassword(password: string | null | undefined): boolean {
  if (!password) return false
  return BCRYPT_HASH_PREFIX.test(password)
}

export async function hashLobbyPassword(password: string | null | undefined): Promise<string | null> {
  const normalized = normalizeLobbyPassword(password)
  if (!normalized) {
    return null
  }

  return hashPassword(normalized)
}

/**
 * Returns true when the lobby is open (no password set) or the supplied password
 * matches. Note the open-lobby case: this answers "does this password check
 * out", not "is this user allowed in" — callers must not use it as a general
 * authorization gate.
 */
export async function verifyLobbyPassword(
  storedPassword: string | null | undefined,
  providedPassword: string | null | undefined
): Promise<boolean> {
  const normalizedStored = normalizeLobbyPassword(storedPassword)
  if (!normalizedStored) {
    return true
  }

  const normalizedProvided = normalizeLobbyPassword(providedPassword)
  if (!normalizedProvided) {
    return false
  }

  // Only bcrypt hashes are accepted. A stored value that isn't a hash is treated
  // as invalid rather than compared as plain text (#721) — the previous fallback
  // kept unhashed rows working indefinitely, so they were never migrated and
  // stayed readable to anyone with database or backup access.
  if (!isHashedLobbyPassword(normalizedStored)) {
    return false
  }

  try {
    return await comparePassword(normalizedProvided, normalizedStored)
  } catch {
    return false
  }
}
