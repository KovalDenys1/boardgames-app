import type { Page } from '@playwright/test'
import { test, expect } from './support/fixtures'
import { contextForGuest, createGuestLobby, joinAsGuest } from './support/lobby'

/**
 * Rock Paper Scissors, two humans (#870).
 *
 * The engine and the bot are covered by unit tests. What they cannot see is
 * the round trip between two real clients: a pick is a POST, the opponent's
 * pick arrives as a broadcast, and the reveal has to land on both screens
 * from the same authoritative state. The host always throws rock and the
 * guest always throws scissors, so the series is decided in two rounds and
 * the finished overlay shows once with the host holding the rematch controls.
 */
test('two players pick, both see the reveal, and the host holds the rematch', async ({
  browser,
  request,
  baseURL,
}) => {
  const url = baseURL!
  const { code, host } = await createGuestLobby(request, 'rock_paper_scissors', url, 2)
  const guest = await joinAsGuest(request, code, url)

  const contexts = await Promise.all([host, guest].map((seat) => contextForGuest(browser, seat)))

  try {
    const [hostPage, guestPage]: Page[] = await Promise.all(contexts.map((context) => context.newPage()))
    await Promise.all([hostPage.goto(`/lobby/${code}`), guestPage.goto(`/lobby/${code}`)])

    // The waiting room is the shared shell; the RPS screen takes over from
    // status `playing`, so the host starts the game first.
    await expect(hostPage.getByRole('button', { name: /start game/i })).toBeEnabled({ timeout: 20_000 })
    await hostPage.getByRole('button', { name: /start game/i }).click()

    // Only the layout for the current viewport is in the accessibility tree,
    // so a role query sees one board and one set of tiles.
    for (const page of [hostPage, guestPage]) {
      await expect(page.getByRole('button', { name: 'Rock' })).toBeVisible({ timeout: 25_000 })
    }

    const reveal = /takes the round|won this round|lost this round|round is replayed/i

    for (let round = 1; round <= 2; round += 1) {
      await hostPage.getByRole('button', { name: 'Rock' }).click()
      // The host's lock-in reaches the guest by broadcast before the guest has
      // picked: the status line names the host as the one already locked in.
      await expect(guestPage.getByText(/pick your move/i).first()).toBeVisible()
      await guestPage.getByRole('button', { name: 'Scissors' }).click()

      for (const page of [hostPage, guestPage]) {
        await expect(page.getByText(reveal).first()).toBeVisible({ timeout: 15_000 })
      }
      await expect(hostPage.getByText(/you won this round/i).first()).toBeVisible()
      await expect(guestPage.getByText(/you lost this round/i).first()).toBeVisible()
    }

    // Best of three, first to two: rock beat scissors twice, the match is over.
    await expect(hostPage.getByRole('heading', { name: /you win the match/i })).toBeVisible({ timeout: 15_000 })
    await expect(guestPage.getByRole('heading', { name: /wins the match/i })).toBeVisible({ timeout: 15_000 })

    // Rematch controls belong to the host; the guest waits.
    await expect(hostPage.getByRole('button', { name: /play again/i })).toBeVisible()
    await expect(guestPage.getByRole('button', { name: /play again/i })).toHaveCount(0)
  } finally {
    await Promise.all(contexts.map((context) => context.close()))
  }
})
