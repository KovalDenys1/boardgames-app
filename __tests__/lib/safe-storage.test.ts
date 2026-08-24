/**
 * #769 — storage must never throw, whatever the browser does.
 *
 * jest.setup.js installs a working localStorage mock via
 * Object.defineProperty(..., { writable: true }), so each test can swap in a
 * hostile implementation and restore it afterwards.
 */
import {
  getSafeLocalStorage,
  getSafeSessionStorage,
  readLocal,
  readStorage,
  removeLocal,
  removeStorage,
  writeLocal,
  writeStorage,
} from '@/lib/safe-storage'

const realLocalStorage = window.localStorage
const realSessionStorage = window.sessionStorage

function setLocalStorage(value: unknown) {
  Object.defineProperty(window, 'localStorage', { value, writable: true, configurable: true })
}

function setSessionStorage(value: unknown) {
  Object.defineProperty(window, 'sessionStorage', { value, writable: true, configurable: true })
}

afterEach(() => {
  setLocalStorage(realLocalStorage)
  setSessionStorage(realSessionStorage)
})

describe('safe-storage', () => {
  describe('when storage works normally', () => {
    it('round-trips a value', () => {
      writeLocal('k', 'v')
      expect(readLocal('k')).toBe('v')
      removeLocal('k')
      expect(readLocal('k')).toBeNull()
    })

    it('returns a usable storage object', () => {
      expect(getSafeLocalStorage()).not.toBeNull()
      expect(getSafeSessionStorage()).not.toBeNull()
    })
  })

  // The embedded-WebView case that crashed production (Dola/CiCi on Android):
  // window.localStorage is literally null.
  describe('when localStorage is null', () => {
    beforeEach(() => setLocalStorage(null))

    it('getSafeLocalStorage returns null instead of throwing', () => {
      expect(getSafeLocalStorage()).toBeNull()
    })

    it('reads return null and writes are a no-op', () => {
      expect(() => writeLocal('k', 'v')).not.toThrow()
      expect(() => removeLocal('k')).not.toThrow()
      expect(readLocal('k')).toBeNull()
    })
  })

  // Safari private mode / blocked cookies: the property access itself throws.
  describe('when accessing localStorage throws SecurityError', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError')
        },
      })
    })

    it('getSafeLocalStorage swallows the error', () => {
      expect(getSafeLocalStorage()).toBeNull()
    })

    it('read/write/remove stay silent', () => {
      expect(() => writeLocal('k', 'v')).not.toThrow()
      expect(() => removeLocal('k')).not.toThrow()
      expect(readLocal('k')).toBeNull()
    })
  })

  // Some WebViews hand back an object whose methods throw on use.
  describe('when storage methods throw on use', () => {
    beforeEach(() => {
      setLocalStorage({
        getItem: () => { throw new Error('nope') },
        setItem: () => { throw new Error('nope') },
        removeItem: () => { throw new Error('nope') },
      })
    })

    it('is rejected by the probe in getSafeLocalStorage', () => {
      expect(getSafeLocalStorage()).toBeNull()
    })

    it('helpers still do not throw', () => {
      expect(() => writeLocal('k', 'v')).not.toThrow()
      expect(readLocal('k')).toBeNull()
    })
  })

  describe('explicit-storage helpers', () => {
    it('treat a null storage argument as unavailable', () => {
      expect(readStorage(null, 'k')).toBeNull()
      expect(() => writeStorage(null, 'k', 'v')).not.toThrow()
      expect(() => removeStorage(null, 'k')).not.toThrow()
    })

    it('swallow per-call failures (e.g. quota exceeded)', () => {
      const quotaBound = {
        getItem: () => { throw new Error('boom') },
        setItem: () => { throw new Error('QuotaExceededError') },
        removeItem: () => { throw new Error('boom') },
      } as unknown as Storage
      expect(readStorage(quotaBound, 'k')).toBeNull()
      expect(() => writeStorage(quotaBound, 'k', 'v')).not.toThrow()
      expect(() => removeStorage(quotaBound, 'k')).not.toThrow()
    })
  })
})
