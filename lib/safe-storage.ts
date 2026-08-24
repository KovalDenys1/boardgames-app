/**
 * Never-throwing access to Web Storage (#769).
 *
 * `typeof window !== 'undefined'` only covers SSR. In production we saw two
 * further failure modes that crashed whole routes:
 *
 *  - embedded in-app browsers (e.g. the Dola/CiCi WebView on Android, links
 *    opened from a messenger) expose `window.localStorage` as literally `null`,
 *    so `localStorage.getItem(...)` throws
 *    "Cannot read properties of null (reading 'getItem')";
 *  - Safari private mode / blocked cookies make the *property access itself*
 *    throw `SecurityError: The operation is insecure.`
 *
 * Every direct `localStorage` / `sessionStorage` touch should go through this
 * module. Storage is a convenience here (guest session, sound prefs, theme,
 * roll history) — losing it must degrade silently, never break the page.
 */

type MaybeStorage = Storage | null

function resolveStorage(kind: 'localStorage' | 'sessionStorage'): MaybeStorage {
  if (typeof window === 'undefined') return null
  try {
    // The property read itself can throw (SecurityError), hence the try/catch
    // around it rather than just around the later getItem/setItem call.
    const storage = window[kind]
    if (!storage) return null
    // Some WebViews expose an object that throws on first real use — probe it.
    const probeKey = '__boardly_probe__'
    storage.setItem(probeKey, '1')
    storage.removeItem(probeKey)
    return storage
  } catch {
    return null
  }
}

export function getSafeLocalStorage(): MaybeStorage {
  return resolveStorage('localStorage')
}

export function getSafeSessionStorage(): MaybeStorage {
  return resolveStorage('sessionStorage')
}

/** Reads a key, returning null when storage is unavailable or the read fails. */
export function readStorage(storage: MaybeStorage, key: string): string | null {
  if (!storage) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

/** Writes a key; a no-op when storage is unavailable or the write fails (quota, private mode). */
export function writeStorage(storage: MaybeStorage, key: string, value: string): void {
  if (!storage) return
  try {
    storage.setItem(key, value)
  } catch {
    // ignore — storage is best-effort
  }
}

/** Removes a key; a no-op when storage is unavailable. */
export function removeStorage(storage: MaybeStorage, key: string): void {
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // ignore — storage is best-effort
  }
}

/** Convenience wrappers for the common "read/write one localStorage key" case. */
export function readLocal(key: string): string | null {
  return readStorage(getSafeLocalStorage(), key)
}

export function writeLocal(key: string, value: string): void {
  writeStorage(getSafeLocalStorage(), key, value)
}

export function removeLocal(key: string): void {
  removeStorage(getSafeLocalStorage(), key)
}

export function readSession(key: string): string | null {
  return readStorage(getSafeSessionStorage(), key)
}

export function writeSession(key: string, value: string): void {
  writeStorage(getSafeSessionStorage(), key, value)
}

export function removeSession(key: string): void {
  removeStorage(getSafeSessionStorage(), key)
}
