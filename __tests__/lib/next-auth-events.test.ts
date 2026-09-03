/**
 * Guards the removal of the manual OAuth linking path (#796, #826).
 *
 * Three routes used to link an OAuth identity to an account named by request
 * input rather than by completing that provider's flow. All three are gone; the
 * last lived in an `events.signIn` handler that read a cookie and created an
 * `accounts` row for the userId it carried. Asserted against the source rather
 * than the module because importing authOptions pulls next-auth's JWT runtime
 * into the test environment.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.join(__dirname, '..', '..')

describe('manual OAuth linking stays removed', () => {
  it('no longer reads a pendingOAuthLink cookie', () => {
    // The callbacks.signIn callback is legitimate and stays; what was removed
    // is the events.signIn handler, and the cookie is its whole mechanism.
    const source = readFileSync(path.join(root, 'lib/next-auth.ts'), 'utf8')
    expect(source).not.toContain('pendingOAuthLink')
  })

  it('does not ship the manual linking route', () => {
    expect(existsSync(path.join(root, 'app/api/user/link-oauth-manual/route.ts'))).toBe(false)
    expect(existsSync(path.join(root, 'app/api/user/link-oauth/route.ts'))).toBe(false)
    expect(existsSync(path.join(root, 'app/api/user/merge-accounts/route.ts'))).toBe(false)
  })
})
