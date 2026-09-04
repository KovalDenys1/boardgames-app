import type { Page } from '@playwright/test'
import { test, expect } from './support/fixtures'
import { contextForGuest, createGuestLobby, joinAsGuest } from './support/lobby'

/**
 * Alias with three players (#847).
 *
 * The engine is covered by unit tests, including a full three-way round. What
 * they cannot see is the screen: three people used to be below the minimum, so
 * the waiting room, the assignment screen and the describer/guesser split have
 * never rendered for three. The assertion that matters is the last one —
 * exactly one player describes and the other two guess — because that is the
 * whole reason the 2v1 split the ticket proposed could not be built.
 */
test('three players get three teams of one, and one describer with two guessers', async ({
  browser,
  request,
  baseURL,
}) => {
  const url = baseURL!
  const { code, host } = await createGuestLobby(request, 'alias', url, 3)
  const second = await joinAsGuest(request, code, url)
  const third = await joinAsGuest(request, code, url)

  const contexts = await Promise.all(
    [host, second, third].map((guest) => contextForGuest(browser, guest))
  )

  try {
    const pages: Page[] = await Promise.all(contexts.map((context) => context.newPage()))
    await Promise.all(pages.map((page) => page.goto(`/lobby/${code}`)))

    const [hostPage] = pages

    // /lobby/{code} shows the generic lobby until the game is under way — the
    // Alias screens only take over from status `playing` (see
    // resolveDedicatedLobbyPageGameType). So the host starts it first.
    await expect(hostPage.getByRole('button', { name: /start game/i })).toBeEnabled({
      timeout: 20_000,
    })
    await hostPage.getByRole('button', { name: /start game/i }).click()

    // Everyone lands on the assignment screen. With three players the engine
    // starts in the solo layout, so there is no side to pick and the screen
    // says so.
    for (const page of pages) {
      await expect(page.getByTestId('alias-team-assignment')).toBeVisible({ timeout: 25_000 })
    }
    await expect(hostPage.getByText('Everyone for themselves.')).toBeVisible()

    // Three cards, one per person, and no join buttons — switching would leave
    // somebody with an empty team, which is the 2v1 that cannot be played.
    await expect(hostPage.getByText('SOLO')).toHaveCount(3)
    await expect(hostPage.getByRole('button', { name: /^join /i })).toHaveCount(0)

    await hostPage.getByRole('button', { name: /start rounds/i }).click()

    // The point of the whole ticket: somebody describes and the others guess.
    const roles = await Promise.all(
      pages.map(async (page) => {
        const describer = page.getByTestId('alias-describer-screen')
        const guesser = page.getByTestId('alias-guesser-screen')
        await expect(describer.or(guesser)).toBeVisible({ timeout: 25_000 })
        return (await describer.count()) > 0 ? 'describer' : 'guesser'
      })
    )

    expect(roles.filter((role) => role === 'describer')).toHaveLength(1)
    expect(roles.filter((role) => role === 'guesser')).toHaveLength(2)
  } finally {
    await Promise.all(contexts.map((context) => context.close()))
  }
})
