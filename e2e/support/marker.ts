/**
 * Every lobby the end-to-end tests create is named with this, and the teardown
 * deletes by it. Kept in its own module so the cleanup script can import it
 * without pulling in @playwright/test.
 */
export const E2E_LOBBY_MARKER = 'E2E —'
