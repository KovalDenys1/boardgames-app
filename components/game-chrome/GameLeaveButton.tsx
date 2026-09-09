'use client'

import React from 'react'
import LeaveIcon from '@/components/LeaveIcon'

/**
 * The one Leave control every in-game screen shows, in the one place it
 * lives: the `trailing` slot of GameScoreboardHeader, top-right (layout DoD,
 * 2026-09-06). Lifted out of MemoryGameBoard so TTT, Connect Four, RPS and
 * every game after them stop inventing their own.
 *
 * Spectators get the same slot with `href` (a link back to the lobby) so the
 * corner is never empty for anyone.
 */
export interface GameLeaveButtonProps {
  /** Already-translated label ("Leave", "← Back to lobby"). */
  label: string
  onClick?: () => void
  /** Render as a link instead of a button (spectator's way out). */
  href?: string
  /** Icon-only below the compact breakpoint; the label stays for screen readers. */
  compact?: boolean
  variant?: 'leave' | 'back'
}

export default function GameLeaveButton({ label, onClick, href, compact = true, variant = 'leave' }: GameLeaveButtonProps) {
  const className = `game-leave-button game-leave-button--${variant}${compact ? ' game-leave-button--compact' : ''}`
  const content = (
    <>
      {variant === 'leave' && <LeaveIcon />}
      <span className="game-leave-button__label">{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} className={className} aria-label={label}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {content}
    </button>
  )
}
