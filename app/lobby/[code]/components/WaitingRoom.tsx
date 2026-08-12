import { useState } from 'react'
import { useTranslation } from '@/lib/i18n-helpers'
import type { Game, Lobby, GamePlayer } from '@/types/game'
import type { GameEngine } from '@/lib/game-engine'
import { BOT_DIFFICULTIES, type BotDifficulty } from '@/lib/bot-profiles'
import { getLobbyTheme, type LobbyTheme } from '@/lib/lobby-themes'
import { hasBotSupport } from '@/lib/game-catalog'
import { sounds } from '@/lib/sounds'
import LobbyThemeBanner, { RICH_BANNER_THEMES } from '@/components/LobbyThemeBanner'
import TryBotGamesBanner from './TryBotGamesBanner'

const BOT_DIFFICULTY_EMOJI: Record<BotDifficulty, string> = {
  easy: '🙂',
  medium: '😐',
  hard: '😈',
}

interface WaitingRoomProps {
  game: Game | null
  lobby: Lobby
  gameEngine: GameEngine | null
  minPlayers: number
  getCurrentUserId: () => string | null | undefined
  canManageBots?: boolean
  canKickPlayers?: boolean
  onKickBot?: (botPlayerId: string) => void
  onKickPlayer?: (playerId: string) => void
  onProfileClick?: (userId: string) => void
  onInviteFriends?: () => void
  onAddBot?: (difficulty: BotDifficulty) => Promise<void> | void
}

export default function WaitingRoom({
  game,
  lobby,
  minPlayers,
  getCurrentUserId,
  canManageBots,
  canKickPlayers,
  onKickBot,
  onKickPlayer,
  onProfileClick,
  onInviteFriends,
  onAddBot,
}: WaitingRoomProps) {
  const { t } = useTranslation()
  const [pickingBotDifficulty, setPickingBotDifficulty] = useState(false)
  const [addingBot, setAddingBot] = useState(false)

  const playerCount = game?.players?.length || 0
  const maxPlayers = lobby?.maxPlayers || 4
  const openSlots = Math.max(maxPlayers - playerCount, 0)
  const missingPlayers = Math.max(minPlayers - playerCount, 0)
  const lobbyTheme = getLobbyTheme(lobby?.theme)
  const hasCustomTheme = lobby?.theme && lobby.theme !== 'default'
  const showTryBotGames = missingPlayers > 0 && !!game?.createdAt && !hasBotSupport(lobby?.gameType)

  return (
    <div className="space-y-2 px-4 py-4 sm:px-6">
      {/* Theme banner */}
      {hasCustomTheme && (
        <LobbyThemeBanner theme={lobby.theme as LobbyTheme} />
      )}

      {/* Players */}
      {game?.players?.map((p: GamePlayer, index: number) => {
        const isBot = !!p.user?.bot
        const playerName = p.user?.username || p.name || (isBot ? t('game.ui.aiBot') : t('game.ui.player'))
        const isCurrentUser = p.userId === getCurrentUserId()
        const isHost = !isBot && !!lobby.creatorId && p.userId === lobby.creatorId
        const isPremium = !isBot && !!(p.user as { isPremium?: boolean } | undefined)?.isPremium
        const botDifficulty = p.user?.bot?.difficulty as BotDifficulty | undefined
        const difficultyLabel = botDifficulty ? t(`game.ui.botDifficulty${botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)}` as Parameters<typeof t>[0]) : null
        const avatarSrc = p.user?.avatarUrl ?? p.user?.image ?? null
        const canClickProfile = onProfileClick && !isBot

        // Colored ring classes for avatar
        const avatarRingClass = isCurrentUser
          ? 'ring-2 ring-bd-mint ring-offset-2 ring-offset-bd-card-warm'
          : isBot
            ? 'ring-2 ring-bd-lav ring-offset-2 ring-offset-bd-card-warm'
            : ''

        return (
          <div
            key={p.id}
            onClick={canClickProfile ? () => onProfileClick(p.userId) : undefined}
            role={canClickProfile ? 'button' : undefined}
            className={`flex items-center gap-3 rounded-xl border px-3 py-4 sm:px-4 ${
              isCurrentUser
                ? 'border-bd-mint/45 bg-bd-mint/15'
                : isBot
                  ? 'border-bd-lav/35 bg-bd-lav/10'
                  : 'border-bd-line bg-bd-card-warm'
            } ${canClickProfile ? 'cursor-pointer transition-colors hover:border-bd-ink hover:bg-bd-card-warm' : ''}`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={playerName}
                className={`h-11 w-11 shrink-0 rounded-xl border-2 border-bd-ink object-cover shadow-[2px_2px_0_var(--bd-ink)] ${avatarRingClass}`}
              />
            ) : (
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-bd-ink bg-bd-sun text-sm font-extrabold text-bd-ink shadow-[2px_2px_0_var(--bd-ink)] ${avatarRingClass}`}>
                {index + 1}
              </div>
            )}

            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
              <span className={`truncate text-sm font-bold ${isPremium ? 'text-bd-premium' : 'text-bd-ink'}`}>{playerName}</span>
              {isPremium && (
                <span className="shrink-0 text-[11px]" title="Premium">👑</span>
              )}
              {isCurrentUser && !isBot && (
                <span className="rounded-full bg-bd-mint px-1.5 py-0.5 text-[10px] font-bold text-bd-mint-deep">
                  {t('game.ui.you')}
                </span>
              )}
              {isHost && (
                <span className="rounded-full bg-bd-sun px-1.5 py-0.5 text-[10px] font-bold text-bd-ink">
                  {t('game.ui.host')}
                </span>
              )}
              {isBot && (
                <span className="rounded-full bg-bd-lav px-1.5 py-0.5 text-[10px] font-bold text-white">
                  AI
                </span>
              )}
              {isBot && difficultyLabel && (
                <span className="rounded-full bg-bd-bg2 px-1.5 py-0.5 text-[10px] font-bold text-bd-ink-soft">
                  {difficultyLabel}
                </span>
              )}
            </div>

            {/* Kick bot button */}
            {isBot && canManageBots && onKickBot && (
              <button
                onClick={() => onKickBot(p.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-bd-ink-muted transition-all hover:bg-bd-coral/15 hover:text-bd-coral-deep"
                title="Remove bot"
              >
                ✕
              </button>
            )}
            {/* Kick player button */}
            {!isBot && !isCurrentUser && canKickPlayers && onKickPlayer && (
              <button
                onClick={(e) => { e.stopPropagation(); onKickPlayer(p.id) }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-bd-ink-muted transition-all hover:bg-bd-coral/15 hover:text-bd-coral-deep"
                title={t('game.ui.kickPlayer')}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}

      {/* Empty slots — the first one carries the invite / add-bot actions */}
      {Array.from({ length: openSlots }).map((_, i) => {
        const isRequired = i < missingPlayers
        const isPulse = isRequired && i === 0
        const showBotAction = i === 0 && !!onAddBot && !!canManageBots && hasBotSupport(lobby?.gameType)
        const showInviteAction = i === 0 && !!onInviteFriends
        const showActions = showBotAction || showInviteAction

        return (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 rounded-xl border border-dashed border-bd-line bg-bd-bg2/60 px-3 py-3 sm:px-4"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed text-sm font-bold ${
              isPulse
                ? 'animate-pulse border-bd-sun/60 bg-bd-sun/10 text-bd-sun-deep'
                : 'border-bd-line bg-bd-bg2 text-bd-ink-muted'
            }`}>
              {playerCount + i + 1}
            </div>

            {showActions && pickingBotDifficulty ? (
              /* Bot difficulty choice takes over the row — picking adds the bot */
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {BOT_DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    disabled={addingBot}
                    onClick={async () => {
                      sounds.play('click')
                      setAddingBot(true)
                      try {
                        await onAddBot?.(difficulty)
                      } finally {
                        setAddingBot(false)
                        setPickingBotDifficulty(false)
                      }
                    }}
                    className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-bd-line bg-bd-bg px-2 py-2 text-xs font-bold text-bd-ink transition-colors hover:border-bd-ink disabled:opacity-50"
                  >
                    <span aria-hidden>{BOT_DIFFICULTY_EMOJI[difficulty]}</span>
                    <span className="truncate">
                      {t(`game.ui.botDifficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` as Parameters<typeof t>[0])}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  disabled={addingBot}
                  onClick={() => setPickingBotDifficulty(false)}
                  aria-label={t('common.cancel')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-bd-ink-muted transition-colors hover:bg-bd-coral/15 hover:text-bd-coral-deep disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className={`min-w-0 flex-1 truncate text-sm italic ${isRequired ? 'text-bd-ink-soft' : 'text-bd-ink-muted'}`}>
                  {isRequired ? t('game.ui.waitingForPlayer') : t('game.ui.openSlot')}
                </span>
                {showActions && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {showInviteAction && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.play('click')
                          onInviteFriends?.()
                        }}
                        className="flex items-center gap-1 rounded-lg border border-bd-line bg-bd-bg px-2.5 py-2 text-xs font-bold text-bd-ink transition-colors hover:border-bd-ink"
                      >
                        <span aria-hidden>💌</span>
                        <span>{t('game.ui.slotInvite')}</span>
                      </button>
                    )}
                    {showBotAction && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.play('click')
                          setPickingBotDifficulty(true)
                        }}
                        className="flex items-center gap-1 rounded-lg border border-bd-line bg-bd-bg px-2.5 py-2 text-xs font-bold text-bd-ink transition-colors hover:border-bd-ink"
                      >
                        <span aria-hidden>🤖</span>
                        <span>{t('game.ui.slotAddBot')}</span>
                        <span aria-hidden className="text-bd-ink-muted">▾</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {showTryBotGames && game?.createdAt && (
        <TryBotGamesBanner waitingSinceMs={new Date(game.createdAt).getTime()} />
      )}
    </div>
  )
}
