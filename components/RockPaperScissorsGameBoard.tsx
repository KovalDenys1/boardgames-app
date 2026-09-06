'use client'

import { useTranslation, type TranslationKeys } from '@/lib/i18n-helpers'
import { RockPaperScissorsGameData, RPSChoice, RPSRound } from '@/lib/games/rock-paper-scissors-game'

type TFn = ReturnType<typeof useTranslation>['t']

/**
 * The Rock Paper Scissors board: three choice tiles and the reveal of the
 * latest round. Scoreboard, status line, result overlay, history and chat
 * are the shared game-chrome kit, composed by the page (#870) — this file
 * only knows how to pick and how to show a reveal.
 *
 * It fills the board card: every size comes from the card's container units
 * (`.rps-*` in globals.css), and on a wide card the tiles sit beside the
 * reveal instead of above it — layout DoD, no empty regions.
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

function roundOutcomeLabel(round: RPSRound, viewerId: string, players: RPSPlayer[], t: TFn): string {
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
  const showTiles = !isGameOver && !isSpectator

  const revealFor = (player: RPSPlayer | null): RPSChoice | null => {
    if (!player || !latestRound?.choices) return null
    return (latestRound.choices[player.id] as RPSChoice | undefined) ?? null
  }

  return (
    <div className="rps-board" data-testid={testId}>
      {showTiles && (
        <div className="rps-tiles">
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
                className={`rps-tile${isSelected ? ' rps-tile--selected' : ''}${dimmed ? ' rps-tile--dimmed' : ''}`}
                style={isSelected ? { borderColor: accent, boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 30%, transparent)` } : undefined}
              >
                <span className="rps-tile__emoji">{emoji}</span>
                <span className="rps-tile__label">{t(labelKey)}</span>
                <span className="rps-tile__beats">{t('games.rock_paper_scissors.beats', { target: beats })}</span>
                {isSelected && isSubmitting && <span className="rps-tile__beats">…</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="rps-reveal">
        {latestRound ? (
          <>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'ui-monospace,monospace',
                color: 'var(--bd-ink-muted)',
              }}
            >
              {t('games.rock_paper_scissors.roundNum', { num: gameData.rounds.length })}
            </div>
            <div className="rps-reveal__grid">
              <RevealTile name={leftPlayer?.name ?? '—'} choice={revealFor(leftPlayer)} winner={latestRound.winner === leftPlayer?.id} t={t} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--bd-ink-muted)' }}>vs</span>
              <RevealTile name={rightPlayer?.name ?? '—'} choice={revealFor(rightPlayer)} winner={latestRound.winner === rightPlayer?.id} t={t} />
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 'clamp(13px, 2.4cqh, 16px)',
                fontWeight: 700,
                color: latestRound.winner === 'draw' ? 'var(--bd-ink-soft)' : latestRound.winner === playerId ? 'var(--bd-mint-deep)' : 'var(--bd-coral-deep)',
              }}
            >
              {roundOutcomeLabel(latestRound, playerId, players, t)}
            </div>
          </>
        ) : (
          // First screen of a match: the space that will hold reveals explains
          // the game instead of standing empty.
          <div className="rps-rules">
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-monospace,monospace', color: 'var(--bd-ink-muted)' }}>
              {t('games.rock_paper_scissors.rulesTitle')}
            </div>
            <div>{t('games.rock_paper_scissors.rockBeatsScissors')}</div>
            <div>{t('games.rock_paper_scissors.scissorsBeatsPaper')}</div>
            <div>{t('games.rock_paper_scissors.paperBeatsRock')}</div>
            <div style={{ color: 'var(--bd-ink-muted)', fontSize: 'clamp(11px, 2cqh, 13px)' }}>
              {isSpectator ? t('games.rock_paper_scissors.bothChoosing') : t('games.rock_paper_scissors.noRoundsYet')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RevealTile({ name, choice, winner, t }: { name: string; choice: RPSChoice | null; winner: boolean; t: TFn }) {
  return (
    <div className={`rps-reveal__tile${winner ? ' rps-reveal__tile--winner' : ''}`}>
      <div style={{ fontSize: 'clamp(10px, 1.8cqh, 12px)', fontWeight: 700, color: 'var(--bd-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      <div className="rps-reveal__emoji">{getChoiceEmoji(choice)}</div>
      <div style={{ fontSize: 'clamp(11px, 2cqh, 13px)', fontWeight: 600, color: 'var(--bd-ink-soft)' }}>{choice ? t(CHOICE_LABEL_KEY[choice]) : '—'}</div>
    </div>
  )
}
