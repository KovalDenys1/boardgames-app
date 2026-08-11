import { isSignatureAuthenticatedWebhook } from '@/lib/csrf'

// Note: verifyCsrfToken and the proxy middleware itself take a NextRequest, which
// cannot be constructed under jsdom (whatwg-fetch's Request conflicts with it) and
// the node/edge test environments are currently broken by the jest 30 mismatch
// tracked in #693. So this covers the exemption predicate as a pure function; the
// middleware wiring is verified by reading proxy.ts.
describe('isSignatureAuthenticatedWebhook', () => {
  it('exempts the Stripe webhook, which arrives with no Origin or Referer (#713)', () => {
    expect(isSignatureAuthenticatedWebhook('/api/stripe/webhook')).toBe(true)
  })

  it('does not exempt ordinary API routes', () => {
    expect(isSignatureAuthenticatedWebhook('/api/lobby')).toBe(false)
    expect(isSignatureAuthenticatedWebhook('/api/stripe/checkout')).toBe(false)
    expect(isSignatureAuthenticatedWebhook('/api/game/abc/state')).toBe(false)
  })

  it('matches exactly, so a lookalike path is not exempt', () => {
    expect(isSignatureAuthenticatedWebhook('/api/stripe/webhook-spoof')).toBe(false)
    expect(isSignatureAuthenticatedWebhook('/api/stripe/webhook/')).toBe(false)
    expect(isSignatureAuthenticatedWebhook('/api/stripe/webhook/extra')).toBe(false)
  })
})
