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
  // Full ordering of player ids, best first — placement source for games whose
  // engines expose a ranking instead of per-player `placement` fields.
  rankingOrder?: string[]
}): {
  terminalFields: TerminalFields | Record<string, never>
  changedPlayerUpdates: ChangedPlayerUpdate[]
} {
  const { statusChanged, status, winner, startedAt, enginePlayers, dbPlayersByUserId, getScorecard, rankingOrder } = params

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

    playerResults = enginePlayers.map((ep, i) => {
      const explicitPlacement = (ep as { placement?: number }).placement
      const rankingIndex = rankingOrder ? rankingOrder.indexOf(ep.id) : -1
      return {
        userId: dbPlayersByUserId.get(ep.id)?.userId ?? ep.id,
        placement: typeof explicitPlacement === 'number'
          ? explicitPlacement
          : rankingIndex >= 0
            ? rankingIndex + 1
            : i + 1,
        finalScore: typeof ep.score === 'number' ? ep.score : null,
        isWinner: ep.id === winner,
      }
    })
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

export interface PartyGameTerminalUpdate {
  terminalFields: TerminalFields
  changedPlayerUpdates: ChangedPlayerUpdate[]
}

/**
 * Terminal-fields adapter for the games that persist through their own
 * dedicated action routes (guess_the_spy, fake_artist, liars_party,
 * sketch_and_guess, telephone_doodle) plus the lobby route's timeout-fallback
 * committer — the writers that historically never set
 * isWinner/finalScore/placement at all (#729).
 *
 * All five engines expose a single `state.winner` (top of `data.ranking` for
 * the four ranking games; highest cumulative `data.scores` for Spy, unset on a
 * tie), so the same validated derivation the two generic routes use applies
 * unchanged. This adapter only normalizes the engine-specific state shapes:
 * Spy keeps scores in `data.scores` rather than on `players[].score`, and the
 * ranking games carry placement as `data.ranking` order rather than per-player
 * fields.
 *
 * Returns null unless this persist is the transition INTO a terminal status —
 * callers keep their existing per-move score sync for every other persist.
 */
export function buildPartyGameTerminalUpdate(params: {
  previousStatus: string
  state: { status: string; winner?: string | null; players?: unknown[]; data?: unknown }
  startedAt: Date | null
  dbPlayers: DbPlayerRecord[]
}): PartyGameTerminalUpdate | null {
  const { previousStatus, state, startedAt, dbPlayers } = params

  if (previousStatus === state.status || !TERMINAL_STATUSES.has(state.status)) {
    return null
  }

  const data = state.data && typeof state.data === 'object'
    ? state.data as Record<string, unknown>
    : {}

  const rawScores = data.scores && typeof data.scores === 'object' ? data.scores as Record<string, unknown> : null
  const scoreFor = (playerId: string): number | undefined => {
    const value = rawScores?.[playerId]
    return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : undefined
  }

  const enginePlayers: Player[] = (Array.isArray(state.players) ? state.players : [])
    .flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const id = (entry as { id?: unknown }).id
      if (typeof id !== 'string' || id.length === 0) return []
      // data.scores takes priority: Spy's base-engine players carry a
      // permanently-stale `score: 0` (only data.scores is ever updated), while
      // the ranking games mirror the same value into both places anyway.
      const ownScore = (entry as { score?: unknown }).score
      const score = scoreFor(id) ?? (
        typeof ownScore === 'number' && Number.isFinite(ownScore)
          ? Math.floor(ownScore)
          : undefined
      )
      return [{
        id,
        name: typeof (entry as { name?: unknown }).name === 'string' ? (entry as { name: string }).name : id,
        ...(score !== undefined ? { score } : {}),
      }]
    })

  const declaredRanking = Array.isArray(data.ranking)
    ? data.ranking.filter((id): id is string => typeof id === 'string')
    : []
  const rankingOrder = declaredRanking.length > 0
    ? declaredRanking
    : rawScores
      ? [...enginePlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => p.id)
      : undefined

  const { terminalFields, changedPlayerUpdates } = buildTerminalFieldsAndPlayerUpdates({
    statusChanged: true,
    status: state.status,
    winner: typeof state.winner === 'string' ? state.winner : null,
    startedAt,
    enginePlayers,
    dbPlayersByUserId: new Map(dbPlayers.map((player) => [player.userId, player])),
    getScorecard: null,
    rankingOrder,
  })

  return { terminalFields: terminalFields as TerminalFields, changedPlayerUpdates }
}
