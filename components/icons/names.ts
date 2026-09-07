/**
 * Every chrome icon Boardly ships. Adding a name here without a glyph in
 * glyphs.tsx is a type error, so the union and the set never drift.
 *
 * Naming: the thing, not the use ("eye", not "spectate") – one glyph can
 * serve several features.
 */
export const ICON_NAMES = [
  // actions & status
  'check',
  'close',
  'plus',
  'minus',
  'arrow-left',
  'arrow-right',
  'play',
  'info',
  'warning',
  'question',
  'search',
  'copy',
  'clipboard',
  'link',
  'mail',
  // visibility & sound
  'eye',
  'eye-off',
  'sound-on',
  'sound-off',
  // people & rank
  'user',
  'users',
  'crown',
  'star',
  'sparkle',
  'heart',
  'lock',
  'shield',
  'trophy',
  'medal',
  'flame',
  'bolt',
  'gem',
  // play
  'gamepad',
  'dice',
  'cards',
  'mask',
  'target',
  'hourglass',
  'clock',
  'rock',
  'paper',
  'scissors',
  // bots
  'robot',
  'bot-easy',
  'bot-medium',
  'bot-hard',
  // places & things
  'home',
  'map',
  'globe',
  'laptop',
  'rocket',
  'bulb',
  'pencil',
  'chart',
  'tag',
  'party',
  'butterfly',
  'handshake',
] as const

export type IconName = (typeof ICON_NAMES)[number]
