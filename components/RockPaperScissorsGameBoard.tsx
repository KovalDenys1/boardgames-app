'use client'

import { useTranslation, type TranslationKeys } from '@/lib/i18n-helpers'
import { RockPaperScissorsGameData, RPSChoice } from '@/lib/games/rock-paper-scissors-game'

type TFn = ReturnType<typeof useTranslation>['t']

/**
 * The Rock Paper Scissors board, composed as a duel (#870, layout DoD):
 *
 *   ┌──────── stage ────────┐   two hands, mine and the opponent's, with
 *   │  ✊  vs  ❔            │   "choosing / locked in", and the reveal of
 *   │  Denys    Pattern R.  │   the latest round shown large;
 *   ├──────── tiles ────────┤   three same-sized choice tiles;
 *   │  🪨    📄    ✂️        │
 *   ├──────── foot ─────────┤   one line of rules and my pick counts.
 *   └───────────────────────┘
 *
 * Scoreboard, status line, result overlay, history and chat are the shared
 * game-chrome kit, composed by the page. Every size here comes from one
 * scale (`.rps-*` in globals.css) so nothing on the card is a different
 * size for no reason.
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

  // Seat the viewer on the left; a spectator sees the roster order.
  const me = players.find((player) => player.id === playerId) ?? null
  const leftPlayer = me ?? players[0] ?? null
  const rightPlayer = players.find((player) => player.id !== leftPlayer?.id) ?? null

  const isGameOver = !!gameData.gameWinner
  const latestRound = gameData.rounds[gameData.rounds.length - 1] ?? null
  const readyIds = gameData.playersReady
  const roundInProgress = readyIds.length > 0
  const mySubmitted = !!playerId && readyIds.includes(playerId)
  const myCurrentChoice = playerId ? ((gameData.playerChoices[playerId] as RPSChoice | null | undefined) ?? null) : null
  const canChoose = !isSpectator && !disabled && !isSubmitting && !mySubmitted && !isGameOver && players.length >= 2
  // Between rounds the stage replays the reveal; once anyone picks again it
  // turns back into two hands choosing.
  const showReveal = !!latestRound && (!roundInProgress || isGameOver)

  const handFor = (player: RPSPlayer | null) => {
    if (!player) return { emoji: '❔', state: '', tone: 'idle' as const }
    const isMe = player.id === playerId
    if (showReveal && latestRound) {
      const choice = (latestRound.choices?.[player.id] as RPSChoice | undefined) ?? null
      const won = latestRound.winner === player.id
      const draw = latestRound.winner === 'draw'
      return {
        emoji: getChoiceEmoji(choice),
        state: draw ? t('lobby.game.draw') : won ? t('lobby.game.win') : t('lobby.game.loss'),
        tone: draw ? ('idle' as const) : won ? ('win' as const) : ('loss' as const),
      }
    }
    const locked = readyIds.includes(player.id)
    if (isMe && locked) return { emoji: getChoiceEmoji(myCurrentChoice), state: t('games.rock_paper_scissors.lockedIn'), tone: 'locked' as const }
    if (locked) return { emoji: '✊', state: t('games.rock_paper_scissors.lockedIn'), tone: 'locked' as const }
    return { emoji: '✊', state: t('games.rock_paper_scissors.choosing'), tone: 'choosing' as const }
  }

  const stageCenter = showReveal && latestRound
    ? latestRound.winner === 'draw'
      ? t('games.rock_paper_scissors.roundDraw')
      : t('games.rock_paper_scissors.roundWonBy', { player: players.find((p) => p.id === latestRound.winner)?.name ?? t('game.ui.playerFallback') })
    : t('games.rock_paper_scissors.roundNum', { num: gameData.rounds.length + 1 })

  const myPickCounts = (() => {
    const counts: Record<RPSChoice, number> = { rock: 0, paper: 0, scissors: 0 }
    if (!playerId) return counts
    for (const round of gameData.rounds) {
      const choice = round.choices?.[playerId] as RPSChoice | undefined
      if (choice && choice in counts) counts[choice] += 1
    }
    return counts
  })()

  return (
    <div className="rps-board" data-testid={testId}>
      <section className="rps-stage" aria-live="polite">
        <Hand name={leftPlayer?.name ?? '—'} {...handFor(leftPlayer)} side="left" />
        <div className="rps-stage__center">
          <span className="rps-stage__vs">vs</span>
          <span className={`rps-stage__result${showReveal ? ' rps-stage__result--reveal' : ''}`}>{stageCenter}</span>
        </div>
        <Hand name={rightPlayer?.name ?? '—'} {...handFor(rightPlayer)} side="right" />
      </section>

      {!isGameOver && !isSpectator && (
        <section className="rps-tiles" aria-label={t('games.rock_paper_scissors.pickPrompt')}>
          {CHOICES.map(({ choice, emoji, labelKey, beats, accent }) => {
            const isSelected = myCurrentChoice === choice && mySubmitted
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
              </button>
            )
          })}
        </section>
      )}

      <section className="rps-foot">
        <div className="rps-foot__rules">
          <span>{t('games.rock_paper_scissors.rockBeatsScissors')}</span>
          <span className="rps-foot__dot">·</span>
          <span>{t('games.rock_paper_scissors.scissorsBeatsPaper')}</span>
          <span className="rps-foot__dot">·</span>
          <span>{t('games.rock_paper_scissors.paperBeatsRock')}</span>
        </div>
        {!isSpectator && gameData.rounds.length > 0 && (
          <div className="rps-foot__stats">
            {t('games.rock_paper_scissors.yourPicks')}
            {CHOICES.map(({ choice, emoji }) => (
              <span key={choice} className="rps-foot__stat">
                {emoji} {myPickCounts[choice]}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Hand({ name, emoji, state, tone, side }: { name: string; emoji: string; state: string; tone: 'idle' | 'choosing' | 'locked' | 'win' | 'loss'; side: 'left' | 'right' }) {
  return (
    <div className={`rps-hand rps-hand--${side} rps-hand--${tone}`}>
      <span className="rps-hand__emoji" aria-hidden>{emoji}</span>
      <span className="rps-hand__name">{name}</span>
      <span className="rps-hand__state">{state}</span>
    </div>
  )
}
