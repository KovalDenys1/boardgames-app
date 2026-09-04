/**
 * Server-side driver for Guess the Spy bots.
 *
 * The other games drive bots from the client through
 * POST /api/game/[gameId]/bot-turn, which decides whose turn it is from a turn
 * index. Spy has no turn index: it moves in phases, several players can owe an
 * action at the same time, and one player's action creates another's. So the
 * Spy routes drain bot actions inline instead, on the same engine instance the
 * human's action was just applied to — the caller persists once afterwards.
 */

import { SpyGame } from '@/lib/games/spy-game'
import { SpyBotExecutor, type SpyBotParticipant } from '@/lib/bots/guess-the-spy/spy-bot-executor'
import { getBotDifficulty } from '@/lib/bots'
import type { Move } from '@/lib/game-engine'

interface GamePlayerWithBot {
  userId: string
  user: { bot: { difficulty?: string } | null }
}

/** Bots among a game's players, in seating order, with their difficulty. */
export function collectSpyBots(players: GamePlayerWithBot[]): SpyBotParticipant[] {
  return players
    .filter((player) => !!player.user?.bot)
    .map((player) => ({
      userId: player.userId,
      difficulty: getBotDifficulty(player),
    }))
}

/**
 * Apply everything the bots owe right now. Returns the moves that were applied
 * so the caller can write replay snapshots and announce them; the engine is
 * mutated in place and is the caller's to persist.
 */
export async function runSpyBots(
  spyGame: SpyGame,
  players: GamePlayerWithBot[]
): Promise<Move[]> {
  const bots = collectSpyBots(players)
  if (bots.length === 0) return []

  return SpyBotExecutor.drainPendingActions(spyGame, bots)
}
