import { z } from 'zod'

/**
 * Request schema for POST /api/game/[gameId]/state — the authoritative move
 * endpoint for most games. It previously parsed raw JSON and checked only that
 * `move.type` was truthy, handing everything else straight to per-game
 * validateMove/processMove implementations that vary in strictness (#722).
 *
 * `move.data` stays permissive on purpose: its shape is game-specific and the
 * engines own that validation. What this pins down is the envelope, so a
 * malformed request is rejected at the edge instead of reaching an engine that
 * assumed well-formed input.
 */
export const MAX_MOVE_TYPE_LENGTH = 64

export const gameMoveSchema = z.object({
  type: z.string().trim().min(1).max(MAX_MOVE_TYPE_LENGTH),
  data: z.record(z.string(), z.unknown()).optional(),
})

export const autoActionContextSchema = z.object({
  source: z.literal('turn-timeout'),
  debounceKey: z.string().trim().min(1).max(256),
  turnSnapshot: z.object({
    currentPlayerId: z.string(),
    currentPlayerIndex: z.number().int(),
    lastMoveAt: z.number().nullable(),
    rollsLeft: z.number(),
    updatedAt: z.union([z.string(), z.number()]).nullable(),
  }),
})

export const gameStateRequestSchema = z.object({
  move: gameMoveSchema,
  autoActionContext: autoActionContextSchema.optional(),
})

export type GameStateRequest = z.infer<typeof gameStateRequestSchema>
export type GameMoveRequest = z.infer<typeof gameMoveSchema>
export type AutoActionContextRequest = z.infer<typeof autoActionContextSchema>
