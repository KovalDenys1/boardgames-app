import type { Player } from './game-engine'
import type { Prisma } from '@/prisma/client'
import { toPersistedGameStateInput } from './persisted-game-state'

const TERMINAL_STATUSES = new Set(['finished', 'abandoned', 'cancelled'])

export interface DbPlayerRecord {
  id: string
  userId: string
  score: number
  scorecard: string | null
  finalScore: number | null
  placement: number | null
  isWinner: boolean
}

export interface TerminalPlayerResult {
  userId: string
  placement: number
  finalScore: number | null
  isWinner: boolean
}

export interface TerminalFields {
  endedAt: Date
  durationSeconds: number | null
  terminalMetadata: Prisma.InputJsonValue
}

export interface ChangedPlayerUpdate {
  id: string
  score: number
  scorecard: string
  finalScore?: number | null
  placement?: number | null
  isWinner?: boolean
}

/**
 * Builds the terminal-game bookkeeping (endedAt/durationSeconds/terminalMetadata)
 * and the per-player DB update diff for a move that just landed. Shared by the
 * human-move and bot-move routes, which used to each hand-roll this and had
 * already drifted on how `winnerUserId` gets derived — one validated it against
 * a real player record, the other trusted the engine's `winner` field directly.
 * This keeps a single, validated derivation for both callers.
 */
export function buildTerminalFieldsAndPlayerUpdates(params: {
  statusChanged: boolean
  status: string
  winner: string | null | undefined
  startedAt: Date | null
  enginePlayers: Player[]
  dbPlayersByUserId: Map<string, DbPlayerRecord>
  getScorecard: ((playerId: string) => unknown) | null
}): {
  terminalFields: TerminalFields | Record<string, never>
  changedPlayerUpdates: ChangedPlayerUpdate[]
} {
  const { statusChanged, status, winner, startedAt, enginePlayers, dbPlayersByUserId, getScorecard } = params

  const isTerminal = TERMINAL_STATUSES.has(status)

  // playerResults computed separately from terminalFields (the latter is spread
  // directly into a Prisma `data: {...}` update, so it must contain nothing but
  // real columns — playerResults is only needed internally, for the diffing
  // loop below, via terminalMetadata).
  let terminalFields: TerminalFields | Record<string, never> = {}
  let playerResults: TerminalPlayerResult[] | undefined

  if (statusChanged && isTerminal) {
    const now = new Date()
    const durationSeconds = startedAt instanceof Date
      ? Math.floor((now.getTime() - startedAt.getTime()) / 1000)
      : null

    // A winnerUserId is only trusted once both an engine player AND a DB
    // player agree it exists — trusting the engine's `winner` field alone
    // (unvalidated) is exactly how the two original routes silently drifted.
    const winnerDbPlayer = winner && enginePlayers.some((ep) => ep.id === winner)
      ? dbPlayersByUserId.get(winner) ?? null
      : null

    playerResults = enginePlayers.map((ep, i) => ({
      userId: dbPlayersByUserId.get(ep.id)?.userId ?? ep.id,
      placement: typeof (ep as { placement?: number }).placement === 'number'
        ? (ep as { placement?: number }).placement!
        : i + 1,
      finalScore: typeof ep.score === 'number' ? ep.score : null,
      isWinner: ep.id === winner,
    }))
    const terminalMetadata = {
      outcome: winner ? 'winner' : status === 'finished' ? 'draw' : status,
      winnerUserId: winnerDbPlayer?.userId ?? null,
      isDraw: status === 'finished' && !winner,
      playerResults,
    }
    terminalFields = {
      endedAt: now,
      durationSeconds,
      terminalMetadata: toPersistedGameStateInput(terminalMetadata),
    }
  }

  const terminalPlayerResultsByUserId = new Map(
    playerResults?.map((result) => [result.userId, result]) ?? []
  )

  const changedPlayerUpdates: ChangedPlayerUpdate[] = []
  for (const player of enginePlayers) {
    const dbPlayer = dbPlayersByUserId.get(player.id)
    if (!dbPlayer) continue

    const nextScore = typeof player.score === 'number' ? player.score : 0
    const nextScorecard = JSON.stringify(getScorecard ? getScorecard(player.id) : {})
    const terminalResult = terminalPlayerResultsByUserId.get(player.id)
    const nextFinalScore = terminalResult?.finalScore
    const nextPlacement = terminalResult?.placement
    const nextIsWinner = terminalResult?.isWinner

    if (
      dbPlayer.score === nextScore &&
      dbPlayer.scorecard === nextScorecard &&
      (terminalResult == null ||
        (dbPlayer.finalScore === nextFinalScore &&
          dbPlayer.placement === nextPlacement &&
          dbPlayer.isWinner === nextIsWinner))
    ) {
      continue
    }

    changedPlayerUpdates.push({
      id: dbPlayer.id,
      score: nextScore,
      scorecard: nextScorecard,
      ...(terminalResult != null
        ? { finalScore: nextFinalScore, placement: nextPlacement, isWinner: nextIsWinner }
        : {}),
    })
  }

  return { terminalFields, changedPlayerUpdates }
}
