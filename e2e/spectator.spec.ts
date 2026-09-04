import { test, expect } from '@playwright/test'
import {
  contextForGuest,
  createGuest,
  createGuestLobby,
  enableSpectators,
  joinAsGuest,
} from './support/lobby'

/**
 * Watching a lobby you are not playing in.
 *
 * #845 changed how a spectator learns the realtime topic: it is no longer
 * `lobby:{code}`, which anyone could guess, but a name the spectate endpoint
 * hands over only after its allowSpectators, password and limit checks. Nothing
 * exercised that against a real lobby — the closest thing was a unit test over
 * the response shape, which cannot see whether a watching browser actually
 * receives anything.
 */
test('a spectator sees the game start without reloading', async ({ browser, request, baseURL }) => {
  const url = baseURL!
  const { code, host } = await createGuestLobby(request, 'tic_tac_toe', url, 2)
  await joinAsGuest(request, code, url)
  enableSpectators(code)

  const watcher = await createGuest(request, url)
  const watcherContext = await contextForGuest(browser, watcher)
  const hostContext = await contextForGuest(browser, host)

  try {
    const watcherPage = await watcherContext.newPage()
    await watcherPage.goto(`/lobby/${code}/spectate`)
    await expect(watcherPage.getByText(/game not started/i)).toBeVisible({ timeout: 25_000 })

    const hostPage = await hostContext.newPage()
    await hostPage.goto(`/lobby/${code}`)
    await hostPage.getByRole('button', { name: /start game/i }).click({ timeout: 25_000 })

    // Under fifteen seconds on purpose. The page also polls the snapshot every
    // thirty seconds as a safety net, so a longer wait would pass even with
    // realtime completely dead — which is the thing being tested.
    await expect(watcherPage.getByText(/game not started/i)).toHaveCount(0, { timeout: 15_000 })
  } finally {
    await watcherContext.close()
    await hostContext.close()
  }
})

/**
 * The other half of #845: a lobby that refuses spectators must not hand out the
 * topic either. Before, it turned them away over HTTP while its game state kept
 * going out on a name anyone could guess from the four-digit code.
 */
test('a lobby with spectators disabled gives out no topic', async ({ request, baseURL }) => {
  const url = baseURL!
  const { code } = await createGuestLobby(request, 'tic_tac_toe', url, 2)
  const outsider = await createGuest(request, url)

  const res = await request.get(`${url}/api/lobby/${code}/spectate`, {
    headers: { 'X-Guest-Token': outsider.guestToken },
  })

  expect(res.status()).toBe(403)
  expect(await res.text()).not.toContain('realtimeTopic')

  // And the members-only route is no way around it either.
  const topic = await request.get(`${url}/api/lobby/${code}/realtime-topic`, {
    headers: { 'X-Guest-Token': outsider.guestToken },
  })
  expect(topic.status()).toBe(403)
})
