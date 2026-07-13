export interface RuleNumberBounds {
  min: number
  max: number
  fallback: number
}

/**
 * Reads a numeric rule from `config.rules`, validates it, and clamps it to
 * [min, max] — falling back to `fallback` when unset, non-numeric, or <= 0.
 * Was reimplemented per-engine (each with its own rule key + bounds) in
 * liars-party, telephone-doodle, and sketch-and-guess.
 */
export function resolveBoundedRuleNumber(
  rules: Record<string, unknown> | undefined,
  key: string,
  bounds: RuleNumberBounds
): number {
  const raw = rules?.[key]
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.min(bounds.max, Math.max(bounds.min, Math.floor(raw)))
  }
  return bounds.fallback
}

/** Reads a string field off a move's data payload, or null if absent/not a string. */
export function getStringField(data: Record<string, unknown>, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' ? value : null
}

/**
 * Round-robin player pick: `playerOrder[(round - 1) % playerOrder.length]`,
 * or null for an empty order. Callers apply their own fallback for the
 * empty-order case (e.g. '' or `playerOrder[0]`).
 */
export function resolvePlayerByRoundIndex(round: number, playerOrder: string[]): string | null {
  if (playerOrder.length === 0) return null
  const index = (round - 1) % playerOrder.length
  return playerOrder[index] ?? null
}
