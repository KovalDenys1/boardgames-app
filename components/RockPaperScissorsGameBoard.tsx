'use client'

import { useTranslation, type TranslationKeys } from '@/lib/i18n-helpers'

type TFn = ReturnType<typeof useTranslation>['t']
import { RockPaperScissorsGameData, RPSChoice, RPSRound } from '@/lib/games/rock-paper-scissors-game'

/**
 * The Rock Paper Scissors board: three choice tiles and the reveal of the
 * latest round. Scoreboard, status line, result overlay, history and chat
 * are the shared game-chrome kit, composed by the page (#870) — this file
 * only knows how to pick and how to show a reveal.
 */

export interface RPSPlayer {
  id: string
  name: string
}

interface RockPaperScissorsGameBoardProps {
  gameData: RockPaperScissorsGameData
  /** Empty string for spectators. */
  playerId: string
  players: RPSPlayer[]
  onSubmitChoice: (choice: RPSChoice) => Promise<void>
  disabled?: boolean
  isSubmitting?: boolean
  isSpectator?: boolean
  testId?: string
}

const CHOICES: { choice: RPSChoice; emoji: string; labelKey: TranslationKeys; beats: string; accent: string }[] = [
  { choice: 'rock', emoji: '🪨', labelKey: 'lobby.choice.rock', beats: '✂️', accent: 'var(--bd-lav)' },
  { choice: 'paper', emoji: '📄', labelKey: 'lobby.choice.paper', beats: '🪨', accent: 'var(--bd-sky)' },
  { choice: 'scissors', emoji: '✂️', labelKey: 'lobby.choice.scissors', beats: '📄', accent: 'var(--bd-coral)' },
]

export const CHOICE_LABEL_KEY: Record<RPSChoice, TranslationKeys> = {
  rock: 'lobby.choice.rock',
  paper: 'lobby.choice.paper',
  scissors: 'lobby.choice.scissors',
}

export function getChoiceEmoji(choice: RPSChoice | null | undefined): string {
  if (!choice) return '❔'
  return CHOICES.find((entry) => entry.choice === choice)?.emoji ?? '❔'
}

export function WinPips({ filled, total, color = 'var(--bd-mint-deep)' }: { filled: number; total: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} aria-label={`${filled}/${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            border: `2px solid ${index < filled ? color : 'var(--bd-line)'}`,
            background: index < filled ? color : 'transparent',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        />
      ))}
    </span>
  )
}

function roundOutcomeLabel(
  round: RPSRound,
  viewerId: string,
  players: RPSPlayer[],
  t: TFn
): string {
  if (round.winner === 'draw') return t('games.rock_paper_scissors.roundDraw')
  if (round.winner === viewerId) return t('lobby.game.round_won')
  if (viewerId && players.some((player) => player.id === viewerId)) return t('lobby.game.round_lost')
  const winnerName = players.find((player) => player.id === round.winner)?.name ?? t('game.ui.playerFallback')
  return t('games.rock_paper_scissors.roundWonBy', { player: winnerName })
}

export default function RockPaperScissorsGameBoard({
  gameData,
  playerId,
  players,
  onSubmitChoice,
  disabled = false,
  isSubmitting = false,
  isSpectator = false,
  testId,
}: RockPaperScissorsGameBoardProps) {
  const { t } = useTranslation()

  const leftPlayer = players[0] ?? null
  const rightPlayer = players[1] ?? null
  const isGameOver = !!gameData.gameWinner
  const mySubmitted = !!playerId && gameData.playersReady.includes(playerId)
  const myCurrentChoice = playerId ? ((gameData.playerChoices[playerId] as RPSChoice | null | undefined) ?? null) : null
  const latestRound = gameData.rounds[gameData.rounds.length - 1] ?? null
  const canChoose = !isSpectator && !disabled && !isSubmitting && !mySubmitted && !isGameOver && players.length >= 2

  const revealFor = (player: RPSPlayer | null): RPSChoice | null => {
    if (!player || !latestRound?.choices) return null
    return (latestRound.choices[player.id] as RPSChoice | undefined) ?? null
  }

  return (
    <div
      data-testid={testId}
      style={{
        width: 'min(100%, 560px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      {!isGameOver && !isSpectator && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {CHOICES.map(({ choice, emoji, labelKey, beats, accent }) => {
            const isSelected = myCurrentChoice === choice
            const dimmed = mySubmitted && !isSelected
            return (
              <button
                key={choice}
                type="button"
                onClick={() => void onSubmitChoice(choice)}
                disabled={!canChoose}
                aria-pressed={isSelected}
                aria-label={t(labelKey)}
                className="rps-choice"
                style={{
                  aspectRatio: '1 / 1',
                  minHeight: 0,
                  borderRadius: 18,
                  border: `2px solid ${isSelected ? accent : 'var(--bd-line)'}`,
                  background: isSelected ? 'var(--bd-card-warm)' : 'var(--bd-bg)',
                  boxShadow: isSelected ? `0 0 0 3px color-mix(in srgb, ${accent} 30%, transparent)` : '0 3px 10px rgba(31,27,22,0.06)',
                  opacity: dimmed ? 0.45 : 1,
                  cursor: canChoose ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: 8,
                  fontFamily: 'inherit',
                  color: 'var(--bd-ink)',
                  transition: 'transform 0.15s, opacity 0.2s, box-shadow 0.2s',
                  transform: isSelected ? 'scale(1.03)' : undefined,
                }}
              >
                <span style={{ fontSize: 'clamp(28px, 9cqw, 44px)', lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t(labelKey)}</span>
                <span style={{ fontSize: 10, color: 'var(--bd-ink-muted)' }}>
                  {t('games.rock_paper_scissors.beats', { target: beats })}
                </span>
                {isSelected && isSubmitting && (
                  <span style={{ fontSize: 10, color: 'var(--bd-ink-muted)' }}>…</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {latestRound ? (
        <div
          style={{
            borderRadius: 16,
            border: '1.5px solid var(--bd-line)',
            background: 'var(--bd-bg)',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'ui-monospace,monospace',
              color: 'var(--bd-ink-muted)',
              marginBottom: 6,
            }}
          >
            {t('games.rock_paper_scissors.roundNum', { num: gameData.rounds.length })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            <RevealTile name={leftPlayer?.name ?? '—'} choice={revealFor(leftPlayer)} winner={latestRound.winner === leftPlayer?.id} t={t} />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--bd-ink-muted)' }}>vs</span>
            <RevealTile name={rightPlayer?.name ?? '—'} choice={revealFor(rightPlayer)} winner={latestRound.winner === rightPlayer?.id} t={t} />
          </div>
          <div
            style={{
              marginTop: 8,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: latestRound.winner === 'draw' ? 'var(--bd-ink-soft)' : latestRound.winner === playerId ? 'var(--bd-mint-deep)' : 'var(--bd-coral-deep)',
            }}
          >
            {roundOutcomeLabel(latestRound, playerId, players, t)}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--bd-ink-muted)', padding: '4px 0' }}>
          {t('games.rock_paper_scissors.noRoundsYet')}
        </div>
      )}
    </div>
  )
}

function RevealTile({
  name,
  choice,
  winner,
  t,
}: {
  name: string
  choice: RPSChoice | null
  winner: boolean
  t: TFn
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1.5px solid ${winner ? 'var(--bd-mint-deep)' : 'var(--bd-line)'}`,
        background: winner ? 'color-mix(in srgb, var(--bd-mint) 25%, var(--bd-bg))' : 'var(--bd-card-warm)',
        padding: '8px 6px',
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bd-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      <div style={{ fontSize: 30, lineHeight: 1.2 }}>{getChoiceEmoji(choice)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bd-ink-soft)' }}>{choice ? t(CHOICE_LABEL_KEY[choice]) : '—'}</div>
    </div>
  )
}
