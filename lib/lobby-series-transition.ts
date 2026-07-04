import { prisma } from '@/lib/db'
import type { GameType } from '@/prisma/client'
import { createGameEngine } from '@/lib/game-registry'
import { toPersistedGameStateInput } from '@/lib/persisted-game-state'
import { broadcastToLobby } from '@/lib/supabase-server'
import type { GameEngine } from '@/lib/game-engine'
import { TicTacToeGame } from '@/lib/games/tic-tac-toe-game'

interface TransitionPlayer {
  userId: string
  user?: { bot?: unknown } | null
}

interface TransitionParams {
  lobbyId: string
  lobbyCode: string
  gameType: string
  /** Players from the just-finished game. */
  players: TransitionPlayer[]
}

/**
 * Creates a fresh `waiting` Games row for the lobby, carries over human
 * (non-bot) players, reactivates the lobby, and broadcasts `game-reset` so
 * all connected clients transition back to the waiting room.
 *
 * Shared by the manual "Return to Lobby" host action and the automatic
 * series-complete trigger fired from the move-processing routes.
 */
export async function transitionLobbyToWaitingRoom(params: TransitionParams): Promise<{ gameId: string }> {
  const { lobbyId, lobbyCode, gameType, players } = params
  const humanPlayers = players.filter((p) => !p.user?.bot)

  const initialState = createGameEngine(gameType, 'temp').getState()

  const newGame = await prisma.$transaction(async (tx) => {
    const game = await tx.games.create({
      data: {
        lobbyId,
        gameType: gameType as GameType,
        state: toPersistedGameStateInput(initialState),
        status: 'waiting',
      },
      select: { id: true },
    })

    await tx.players.createMany({
      data: humanPlayers.map((p, i) => ({
        gameId: game.id,
        userId: p.userId,
        position: i,
        scorecard: JSON.stringify({}),
      })),
      skipDuplicates: true,
    })

    return game
  })

  await prisma.lobbies.update({
    where: { id: lobbyId },
    data: { isActive: true },
  })

  await broadcastToLobby(lobbyCode, 'game-reset', { lobbyCode, gameId: newGame.id })

  return { gameId: newGame.id }
}

/**
 * Fire-and-forget auto-transition trigger, shared by the human-move and
 * bot-move processing routes: once a tic-tac-toe series is mathematically
 * decided, immediately reset the lobby to a fresh waiting room instead of
 * requiring a manual "Return to Lobby" click.
 */
export function maybeAutoTransitionCompletedSeries(
  gameEngine: GameEngine,
  gameType: string,
  gameStatus: string,
  transitionParams: TransitionParams,
  onError: (error: Error) => void
): void {
  if (
    gameType === 'tic_tac_toe' &&
    gameStatus === 'finished' &&
    gameEngine instanceof TicTacToeGame &&
    gameEngine.isSeriesComplete()
  ) {
    void transitionLobbyToWaitingRoom(transitionParams).catch(onError)
  }
}
