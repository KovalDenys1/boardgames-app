import type { CSSProperties } from 'react'
import { GLYPHS } from './glyphs'
import type { IconName } from './names'

/**
 * Boardly's chrome icon. One filled glyph on a 24×24 grid, coloured only
 * through `currentColor` (or a token via `tone`), so it survives dark mode
 * and the premium lobby themes without any per-icon work.
 *
 * Decorative by default (aria-hidden). Pass `label` when the icon is the
 * only thing conveying meaning (an icon-only button, a status without text).
 */
export type IconTone =
  | 'current'
  | 'ink'
  | 'soft'
  | 'muted'
  | 'coral'
  | 'mint'
  | 'sun'
  | 'lav'
  | 'sky'
  | 'premium'
  | 'bg'

const TONE_VAR: Record<Exclude<IconTone, 'current'>, string> = {
  ink: 'var(--bd-ink)',
  soft: 'var(--bd-ink-soft)',
  muted: 'var(--bd-ink-muted)',
  coral: 'var(--bd-coral)',
  mint: 'var(--bd-mint)',
  sun: 'var(--bd-sun)',
  lav: 'var(--bd-lav)',
  sky: 'var(--bd-sky)',
  premium: 'var(--bd-premium)',
  bg: 'var(--bd-bg)',
}

export interface IconProps {
  name: IconName
  /** Rendered width and height in px. 16 for chips, 20 for inline text, 24 for buttons. */
  size?: number
  tone?: IconTone
  /** Accessible name. Omit for decorative icons next to visible text. */
  label?: string
  className?: string
  style?: CSSProperties
}

export default function Icon({ name, size = 20, tone = 'current', label, className, style }: IconProps) {
  const color = tone === 'current' ? undefined : TONE_VAR[tone]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      data-icon={name}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', color, ...style }}
    >
      {GLYPHS[name]}
    </svg>
  )
}
