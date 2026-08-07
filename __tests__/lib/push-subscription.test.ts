/**
 * @jest-environment jsdom
 */
import { isPushSupported, getPushPermissionState, subscribeToPush } from '@/lib/push-subscription'

const originalEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

describe('push-subscription', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalEnv
    jest.restoreAllMocks()
  })

  describe('isPushSupported / getPushPermissionState', () => {
    it('reports unsupported when the Notification API is missing', () => {
      const original = (window as unknown as { Notification?: unknown }).Notification
      delete (window as any).Notification
      expect(isPushSupported()).toBe(false)
      expect(getPushPermissionState()).toBe('unsupported')
      ;(window as any).Notification = original
    })
  })

  describe('subscribeToPush', () => {
    const callOrder: string[] = []
    let requestPermissionMock: jest.Mock

    beforeEach(() => {
      callOrder.length = 0
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BCjD4h3jyoSIqEkl8yCpOQswsNjjJvi6YYNZss3VwCYoWhux3AeIWYuJUEdUVM0HWVDk6aD5aAT_ZnpC0V_Es-0'

      requestPermissionMock = jest.fn(async () => {
        callOrder.push('requestPermission')
        return 'granted'
      })
      // jsdom doesn't implement the Notification API at all; stub the pieces
      // isPushSupported()/subscribeToPush() actually touch.
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: { requestPermission: requestPermissionMock },
      })
      Object.defineProperty(window, 'PushManager', {
        configurable: true,
        writable: true,
        value: function PushManager() {},
      })

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          get ready() {
            callOrder.push('serviceWorker.ready')
            return Promise.resolve({
              pushManager: {
                subscribe: jest.fn().mockResolvedValue({ endpoint: 'https://example.com/push' }),
              },
            })
          },
        },
      })
    })

    it('requests permission before waiting on service-worker readiness', async () => {
      // Regression test for the bug this fixes: awaiting serviceWorker.ready
      // (or anything else) before requestPermission() can burn through the
      // browser's transient-user-activation window from the triggering
      // click, causing the permission prompt to hang or silently no-op.
      const sub = await subscribeToPush()

      expect(sub).toEqual({ endpoint: 'https://example.com/push' })
      expect(callOrder).toEqual(['requestPermission', 'serviceWorker.ready'])
    })

    it('never touches the service worker when permission is denied', async () => {
      requestPermissionMock.mockImplementation(async () => {
        callOrder.push('requestPermission')
        return 'denied'
      })

      const sub = await subscribeToPush()

      expect(sub).toBeNull()
      expect(callOrder).toEqual(['requestPermission'])
    })

    it('returns null without requesting permission when VAPID key is missing', async () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      const sub = await subscribeToPush()

      expect(sub).toBeNull()
      expect(callOrder).toEqual([])
    })
  })
})
