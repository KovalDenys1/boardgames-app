'use client'

import React from 'react'

/**
 * Shared two-player scoreboard row (#736 phase 3): left card, game-specific
 * center block, right card, optional trailing control (e.g. Memory's Leave
 * button). The decorated background card around it stays per-game — the
 * shared part is the 1fr/auto/1fr row every game was hand-rolling.
 */
export default function GameScoreboardHeader({
  leftCard,
  center,
  rightCard,
  trailing,
}: {
  leftCard: React.ReactNode
  center: React.ReactNode
  rightCard: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
      {leftCard}
      <div style={{ textAlign: 'center' }}>{center}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
        {/* The left card fills its grid cell; in this flex cell the right card
            would shrink to its text, so it is told to fill too – two cards of
            the same kind must be the same size (layout DoD). */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>{rightCard}</div>
        {trailing}
      </div>
    </div>
  )
}
