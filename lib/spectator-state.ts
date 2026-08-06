import { sanitizeRpsStateForBroadcast } from '@/lib/games/rock-paper-scissors-game'
import { sanitizeSketchAndGuessStateForBroadcast } from '@/lib/games/sketch-and-guess-game'

type JsonObject = Record<string, unknown>

function parseGameState(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function scrubSpyIdentity(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubSpyIdentity(entry))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const source = value as JsonObject
  const result: JsonObject = {}

  for (const [key, rawChild] of Object.entries(source)) {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey === 'isspy' ||
      lowerKey === 'spyid' ||
      lowerKey === 'spyuserid' ||
      lowerKey === 'spyplayerid' ||
      lowerKey === 'spyindex' ||
      lowerKey === 'playerroles'
    ) {
      continue
    }

    const shouldTryParseJsonString =
      typeof rawChild === 'string' &&
      (lowerKey === 'state' || lowerKey === 'initialstate' || lowerKey === 'game')

    if (shouldTryParseJsonString) {
      const parsed = parseGameState(rawChild)
      if (parsed && typeof parsed === 'object') {
        result[key] = scrubSpyIdentity(parsed)
        continue
      }
    }

    result[key] = scrubSpyIdentity(rawChild)
  }

  return result
}

export function sanitizeGameStateForSpectator(
  gameType: string,
  rawState: unknown,
  gameStatus?: string
): unknown {
  const parsed = parseGameState(rawState)
  if (!parsed) {
    return parsed
  }

  // Reveal spy identity once the game is finished — spectators can discuss who was the spy
  if (gameType === 'guess_the_spy' && gameStatus !== 'finished') {
    return scrubSpyIdentity(parsed)
  }

  // Spectators never own a choice, so always redact a still-pending one (no viewer exception)
  if (gameType === 'rock_paper_scissors' && typeof parsed === 'object' && parsed !== null) {
    return sanitizeRpsStateForBroadcast(parsed as { data?: unknown; status?: string })
  }

  // Spectators are never a drawer, so always redact the live prompt (no viewer exception)
  if (gameType === 'sketch_and_guess' && typeof parsed === 'object' && parsed !== null) {
    return sanitizeSketchAndGuessStateForBroadcast(parsed as { data?: unknown; status?: string })
  }

  return parsed
}
