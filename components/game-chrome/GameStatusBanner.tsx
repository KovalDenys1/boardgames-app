'use client'

import React from 'react'
import { useTranslation } from '@/lib/i18n-helpers'

/**
 * Shared turn/result status banner (#736 phase 4) — replaces
 * TttStatusBanner / C4StatusBanner / MemoryStatusBanner, which had drifted:
 * timer danger threshold 5s vs 10s, win badge text vs emoji, spectator
 * variant present in only two of three. Unified: danger at ≤10s, text
 * badges via game.ui keys, spectator variant available to every adopter.
 */
export interface GameStatusBannerProps {
  isFinished: boolean
  isDraw?: boolean
  /** Already-translated result line ("Alice wins!", "It's a tie") — required when finished. */
  finishedMessage?: string
  /** Already-translated active-turn line ("Alice's turn"). */
  activeTitle: string
  /** Small trailing meta next to the title ("#5", "3/8"). */
  meta?: React.ReactNode
  secs: number
  turnTimerLimit: number
  /** Progress bar (and win-plate shadow) accent. */
  barColor: string
  /** Optional icon before the title (TTT mark, C4 disc). */
  leadingIcon?: React.ReactNode
  isSpectator?: boolean
}

/** Single danger threshold for every game (was 5s in TTT/C4, 10s in Memory). */
const DANGER_SECONDS = 10

export default function GameStatusBanner({
  isFinished,
  isDraw = false,
  finishedMessage,
  activeTitle,
  meta,
  secs,
  turnTimerLimit,
  barColor,
  leadingIcon,
  isSpectator = false,
}: GameStatusBannerProps) {
  const { t } = useTranslation()

  if (isFinished) {
    const badgeStyle: React.CSSProperties = {
      display: 'inline-flex', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      border: '2px solid var(--bd-ink)', boxShadow: '2px 2px 0 var(--bd-ink)', fontFamily: 'var(--bd-font-display)',
      ...(isDraw
        ? { background: 'var(--bd-lav)', color: 'white' }
        : { background: 'var(--bd-sun)', color: 'var(--bd-ink)' }),
    }
    return (
      <div style={{
        padding: '10px 16px', borderRadius: 14, background: 'var(--bd-ink)', color: 'var(--bd-bg)',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: `0 4px 0 ${isDraw ? 'var(--bd-lav)' : barColor}`,
      }}>
        <span style={badgeStyle}>{isDraw ? t('game.ui.drawBadge') : t('game.ui.victoryBadge')}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{finishedMessage}</span>
      </div>
    )
  }

  if (isSpectator) {
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 14, background: 'var(--bd-bg)',
        border: '1.5px solid var(--bd-line)', boxShadow: '0 4px 14px rgba(31,27,22,0.07)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 14 }}>👁</span>
        {leadingIcon}
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--bd-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTitle}</span>
        {meta !== undefined && <span style={{ fontSize: 11, color: 'var(--bd-ink-muted)', marginLeft: 2 }}>{meta}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--bd-ink-muted)', whiteSpace: 'nowrap' }}>{t('game.ui.spectatingBadge')}</span>
      </div>
    )
  }

  const pct = turnTimerLimit > 0 ? (secs / turnTimerLimit) * 100 : 100
  const danger = secs <= DANGER_SECONDS
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 14, background: 'var(--bd-bg)',
      border: '1.5px solid var(--bd-line)', boxShadow: '0 4px 14px rgba(31,27,22,0.07)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {leadingIcon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--bd-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeTitle}
          {meta !== undefined && (
            <span style={{ color: 'var(--bd-ink-muted)', fontWeight: 500, marginLeft: 6, fontSize: 11 }}>{meta}</span>
          )}
        </div>
        <div style={{ marginTop: 6, height: 5, background: 'var(--bd-bg2)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: pct + '%',
            background: danger ? 'var(--bd-coral)' : barColor,
            transition: 'width 1s linear, background 0.2s',
          }} />
        </div>
      </div>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 700, minWidth: 44, textAlign: 'right',
        color: danger ? 'var(--bd-coral-deep)' : 'var(--bd-ink)',
      }}>
        :{String(secs).padStart(2, '0')}
      </div>
    </div>
  )
}
