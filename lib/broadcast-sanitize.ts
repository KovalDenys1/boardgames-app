import { sanitizeSpyStateForBroadcast } from './games/spy-game'
import { sanitizeRpsStateForBroadcast } from './games/rock-paper-scissors-game'
import { sanitizeSketchAndGuessStateForBroadcast } from './games/sketch-and-guess-game'

/**
 * Single dispatch point for "strip secrets before this state leaves the
 * server" — used by every route that broadcasts or returns authoritative
 * game state (move-processing, bot-turn, lobby poll). Previously each route
 * hand-rolled its own `gameType === 'x' ? sanitizeX() : ...` ternary, and
 * they'd already drifted: the bot-turn route was missing the guess_the_spy
 * branch entirely (harmless today since Spy has no bot support, but a
 * landmine for the next bot-enabled sanitized game type).
 *
 * `viewerUserId` is only meaningful for sanitizers that keep a viewer's own
 * not-yet-revealed data visible to themselves (currently just RPS); pass
 * `null` for a shared broadcast payload with no single viewer.
 */
export function sanitizeStateForBroadcast<T extends { data?: unknown; status?: string }>(
  gameType: string,
  state: T,
  viewerUserId: string | null = null
): T {
  switch (gameType) {
    case 'guess_the_spy':
      return sanitizeSpyStateForBroadcast(state)
    case 'rock_paper_scissors':
      return sanitizeRpsStateForBroadcast(state, viewerUserId)
    case 'sketch_and_guess':
      return sanitizeSketchAndGuessStateForBroadcast(state, viewerUserId)
    default:
      return state
  }
}
