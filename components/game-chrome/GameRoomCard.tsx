'use client'

import React from 'react'
import { useTranslation } from '@/lib/i18n-helpers'
import { showToast } from '@/lib/i18n-toast'
import GameLeaveButton from '@/components/game-chrome/GameLeaveButton'

/**
 * The room card: the slot to the right of the scoreboard on every kit game
 * (layout DoD, scheme A, 2026-09-06). Which game, which room, the invite
 * link for a friend or a spectator, and the way out. Same height as the
 * scoreboard because both sit in the first row of the game grid.
 *
 * `compact` is the phone and landscape form: two icon buttons that share a
 * row with the scoreboard.
 */
export interface GameRoomCardProps {
  emoji: string
  /** Already-translated game name. */
  title: string
  code: string
  isSpectator?: boolean
  onLeave?: () => void
  /** Already-translated Leave label. */
  leaveLabel: string
  /**
   * Whether the lobby admits spectators. Once a game is running nobody can
   * join it as a player, so the only link worth handing out is the spectate
   * one – and only when the lobby allows it. Without it the card says so
   * instead of offering a link that dead-ends on "Lobby is full".
   */
  allowSpectators?: boolean
  compact?: boolean
}

export default function GameRoomCard({ emoji, title, code, isSpectator = false, onLeave, leaveLabel, allowSpectators = false, compact = false }: GameRoomCardProps) {
  const { t } = useTranslation()

  const copyInvite = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard
      .writeText(`${window.location.origin}/lobby/${code}/spectate`)
      .then(() => showToast.success('toast.linkCopied'))
      .catch(() => showToast.error('toast.error'))
  }
  const inviteLabel = t('game.ui.inviteSpectators')

  const exit = isSpectator
    ? <GameLeaveButton label={t('game.ui.backToLobby')} href={`/lobby/${code}`} variant="back" compact={compact} />
    : <GameLeaveButton label={leaveLabel} onClick={onLeave} compact={compact} />

  if (compact) {
    return (
      <div className="game-room-card game-room-card--compact">
        {allowSpectators && (
          <button type="button" className="game-room-card__copy" onClick={copyInvite} aria-label={inviteLabel} title={inviteLabel}>
            👁
          </button>
        )}
        {exit}
      </div>
    )
  }

  return (
    <div className="game-room-card">
      <span className="game-room-card__emoji" aria-hidden>{emoji}</span>
      <div className="game-room-card__text">
        <span className="game-room-card__title">{title}</span>
        <span className="game-room-card__meta">
          <span className="game-room-card__code">#{code}</span>
          {allowSpectators ? (
            <button type="button" className="game-room-card__copy" onClick={copyInvite} aria-label={inviteLabel} title={inviteLabel}>
              👁 <span>{inviteLabel}</span>
            </button>
          ) : (
            <span className="game-room-card__chip">{t('game.ui.spectatorsOff')}</span>
          )}
        </span>
      </div>
      {exit}
    </div>
  )
}
