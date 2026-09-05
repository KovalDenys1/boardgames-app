/**
 * Every lobby the end-to-end tests create is named with this, and the teardown
 * deletes by it. Kept in its own module so the cleanup script can import it
 * without pulling in @playwright/test.
 */
export const E2E_LOBBY_MARKER = 'E2E —'

/**
 * Every guest the tests mint is named with this prefix, and the teardown
 * deletes guests by it. Guest names allow only word characters, spaces and
 * hyphens, and are capped at 20, so the marker has to be plain text. A real
 * guest could in principle pick a name that starts with it; the cleanup also
 * requires `isGuest`, so the worst case is one anonymous guest re-minted on
 * their next visit.
 */
export const E2E_GUEST_PREFIX = 'E2E'
