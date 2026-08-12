import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { showToast } from '@/lib/i18n-toast'
import { getGameMetadata, getCatalogAvailableGames } from '@/lib/game-catalog'
import { useTranslation } from '@/lib/i18n-helpers'
import { LOBBY_THEMES, LOBBY_THEME_IDS, FREE_LOBBY_THEME, type LobbyTheme } from '@/lib/lobby-themes'
import type { Game, Lobby } from '@/types/game'

interface LobbySettingsPanelProps {
  lobby: Lobby
  game: Game | null
  isPremium?: boolean
  /** false = read-only view (non-host, or the game is already playing) */
  canEdit?: boolean
  onUpdateSettings?: (updates: {
    maxPlayers?: number
    turnTimer?: number
    allowSpectators?: boolean
    maxSpectators?: number
    theme?: string
    gameType?: string
  }) => Promise<unknown>
  onClose: () => void
}

type EditableSettingKey = 'maxPlayers' | 'turnTimer' | 'allowSpectators' | 'theme' | 'gameType'

/**
 * Row wrapper that smoothly animates its own height whenever the content
 * swap (value <-> choice chips) changes it — without this the row jumps.
 * Runs after every render, measures, and animates only on an actual change.
 */
function AnimatedSettingRow({
  className,
  onClick,
  children,
}: {
  className: string
  onClick?: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const previousHeight = useRef<number | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const newHeight = element.getBoundingClientRect().height
    const oldHeight = previousHeight.current
    previousHeight.current = newHeight
    if (oldHeight === null || Math.abs(oldHeight - newHeight) < 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    element.animate(
      [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
      { duration: 200, easing: 'ease-out' },
    )
  })

  return (
    <div ref={ref} onClick={onClick} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export default function LobbySettingsPanel({
  lobby,
  game,
  isPremium = false,
  canEdit = false,
  onUpdateSettings,
  onClose,
}: LobbySettingsPanelProps) {
  const { t } = useTranslation()
  const gameMeta = lobby.gameType ? getGameMetadata(lobby.gameType) : null
  const currentPlayers = Array.isArray(game?.players) ? game.players.length : 0
  const maxPlayers = typeof lobby?.maxPlayers === 'number' ? lobby.maxPlayers : 0
  const spectatorsLabel = lobby?.allowSpectators
    ? t('lobby.spectators', { count: lobby?.spectatorCount ?? 0 })
    : t('game.ui.spectatorsDisabled')
  const canEditLobbySettings = Boolean(canEdit && onUpdateSettings)
  const [activeSettingEditor, setActiveSettingEditor] = useState<EditableSettingKey | null>(null)
  const [updatingSetting, setUpdatingSetting] = useState<EditableSettingKey | null>(null)

  const currentTheme = LOBBY_THEMES[((lobby?.theme as LobbyTheme) in LOBBY_THEMES ? lobby?.theme : 'default') as LobbyTheme]

  const turnTimerOptions = useMemo(() => {
    const baseOptions = [30, 60, 90, 120, 150, 180]
    if (typeof lobby?.turnTimer === 'number' && !baseOptions.includes(lobby.turnTimer)) {
      return [...baseOptions, lobby.turnTimer].sort((a, b) => a - b)
    }
    return baseOptions
  }, [lobby?.turnTimer])

  const maxPlayersOptions = useMemo(() => {
    const minByGameType = Math.max(2, gameMeta?.minPlayers ?? 2)
    const minValue = Math.max(minByGameType, currentPlayers)
    const maxByGameType = Math.min(10, gameMeta?.maxPlayers ?? 10)
    const maxValue = Math.max(minValue, maxByGameType)
    return Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index)
  }, [currentPlayers, gameMeta?.maxPlayers, gameMeta?.minPlayers])

  const availableGames = useMemo(() => getCatalogAvailableGames(), [])

  const openEditor = (key: EditableSettingKey) => {
    if (!canEditLobbySettings) return
    setActiveSettingEditor((prev) => (prev === key ? null : key))
  }

  const applySettingUpdate = async (
    key: EditableSettingKey,
    updates: { maxPlayers?: number; turnTimer?: number; allowSpectators?: boolean; maxSpectators?: number; theme?: string; gameType?: string },
  ) => {
    if (!onUpdateSettings) return
    setUpdatingSetting(key)
    try {
      await onUpdateSettings(updates)
      setActiveSettingEditor(null)
      showToast.success('profile.settings.saved')
    } catch (error) {
      showToast.errorFrom(error, 'toast.error')
    } finally {
      setUpdatingSetting(null)
    }
  }

  const rows: Array<{
    key: EditableSettingKey
    icon: React.ReactNode
    label: string
    value: string
    hostOnly?: boolean
  }> = [
    {
      key: 'maxPlayers',
      icon: '👥',
      label: t('lobby.create.maxPlayers'),
      value: t('lobby.playerOccupancy', { current: currentPlayers, max: maxPlayers }),
    },
    {
      key: 'turnTimer',
      icon: '⏱',
      label: t('game.ui.timeLimit'),
      value: lobby?.turnTimer ? `${lobby.turnTimer}s` : '—',
    },
    {
      key: 'allowSpectators',
      icon: '👁',
      label: t('game.ui.spectatorsLabel'),
      value: spectatorsLabel,
    },
    {
      key: 'gameType',
      icon: gameMeta?.icon ?? '🎮',
      label: t('lobby.changeGame'),
      value: gameMeta?.name ?? '—',
    },
    {
      key: 'theme',
      icon: (
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full border border-bd-line/40"
          style={{ background: currentTheme.accent }}
        />
      ),
      label: t('lobby.changeTheme'),
      value: currentTheme.name,
    },
  ]

  return (
    <div className="space-y-2 px-4 py-4 sm:px-6">
      {/* Panel header */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-bd-ink">
          <span aria-hidden className="text-base leading-none">⚙️</span>
          {t('game.ui.settings')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-bd-ink-muted transition-colors hover:bg-bd-bg2 hover:text-bd-ink"
        >
          ✕
        </button>
      </div>

      {rows.map((row) => {
        const isActive = activeSettingEditor === row.key
        const chipClass = (selected: boolean, locked = false) =>
          `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            selected
              ? 'border-bd-ink bg-bd-ink text-bd-bg'
              : locked
                ? 'border-bd-line bg-bd-bg2 text-bd-ink-muted cursor-not-allowed opacity-60'
                : 'border-bd-line bg-bd-bg text-bd-ink hover:border-bd-ink'
          }`

        return (
          <AnimatedSettingRow
            key={row.key}
            /* The whole row opens the editor; while open it does nothing
               (chip clicks bubble here harmlessly, closing is ✕ / label). */
            onClick={canEditLobbySettings && !isActive ? () => openEditor(row.key) : undefined}
            className={`rounded-xl border px-3 py-3 transition-colors sm:px-4 ${
              isActive ? 'border-bd-mint/60 bg-bd-mint/12' : 'border-bd-line bg-bd-card-warm'
            } ${canEditLobbySettings && !isActive ? 'cursor-pointer hover:border-bd-ink' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {/* Label — keyboard-accessible toggle (whole row is clickable too) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openEditor(row.key)
                }}
                disabled={!canEditLobbySettings}
                aria-expanded={canEditLobbySettings ? isActive : undefined}
                className={`flex shrink-0 items-center gap-3 text-left ${canEditLobbySettings ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span aria-hidden className="flex w-6 shrink-0 items-center justify-center text-base">{row.icon}</span>
                <span className="text-sm font-semibold text-bd-ink">{row.label}</span>
              </button>

              {!isActive ? (
                /* Value + chevron on the right */
                <span className="ml-auto flex min-w-0 shrink items-center gap-1.5 text-right">
                  <span className="truncate text-xs font-semibold text-bd-ink-soft">{row.value}</span>
                  {canEditLobbySettings && <span className="shrink-0 text-bd-ink-muted">›</span>}
                </span>
              ) : (
                /* The value smoothly becomes the choice chips, inline in the row */
                <div className="animate-fade-in ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
                  {row.key === 'maxPlayers' &&
                    maxPlayersOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={updatingSetting === 'maxPlayers' || value === maxPlayers}
                        onClick={() => void applySettingUpdate('maxPlayers', { maxPlayers: value })}
                        className={chipClass(value === maxPlayers)}
                      >
                        {value}
                      </button>
                    ))}

                  {row.key === 'turnTimer' &&
                    turnTimerOptions.map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        disabled={updatingSetting === 'turnTimer' || seconds === lobby?.turnTimer}
                        onClick={() => void applySettingUpdate('turnTimer', { turnTimer: seconds })}
                        className={chipClass(seconds === lobby?.turnTimer)}
                      >
                        {seconds}s
                      </button>
                    ))}

                  {row.key === 'allowSpectators' && (
                    <>
                      <button
                        type="button"
                        disabled={isPremium && (updatingSetting === 'allowSpectators' || lobby?.allowSpectators === true)}
                        onClick={() => {
                          if (!isPremium) {
                            showToast.custom('profile.premiumFeatureLocked', '👑')
                            return
                          }
                          void applySettingUpdate('allowSpectators', { allowSpectators: true })
                        }}
                        title={isPremium ? undefined : '👑 Premium'}
                        className={chipClass(Boolean(lobby?.allowSpectators), !isPremium)}
                      >
                        {t('common.enabled')}{!isPremium && ' 👑'}
                      </button>
                      <button
                        type="button"
                        disabled={updatingSetting === 'allowSpectators' || lobby?.allowSpectators === false}
                        onClick={() => void applySettingUpdate('allowSpectators', { allowSpectators: false })}
                        className={chipClass(lobby?.allowSpectators === false)}
                      >
                        {t('common.disabled')}
                      </button>
                      {lobby?.allowSpectators && (
                        <>
                          {/* Force the limit picker onto its own wrap line */}
                          <span aria-hidden className="w-full" />
                          <span className="text-[11px] font-semibold text-bd-mint-deep">{t('lobby.maxSpectatorsLabel')}</span>
                          {([0, 5, 10, 20] as const).map((limit) => {
                            const isLimitActive = (lobby?.maxSpectators ?? 0) === limit
                            return (
                              <button
                                key={limit}
                                type="button"
                                disabled={updatingSetting === 'allowSpectators' || isLimitActive}
                                onClick={() => void applySettingUpdate('allowSpectators', { maxSpectators: limit })}
                                className={chipClass(isLimitActive)}
                              >
                                {limit === 0 ? t('lobby.maxSpectatorsUnlimited') : String(limit)}
                              </button>
                            )
                          })}
                        </>
                      )}
                    </>
                  )}

                  {row.key === 'gameType' &&
                    availableGames.map((g) => {
                      const meta = g.gameType ? getGameMetadata(g.gameType) : null
                      const isGameActive = g.gameType === lobby?.gameType
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={updatingSetting === 'gameType' || isGameActive}
                          onClick={() => g.gameType && void applySettingUpdate('gameType', { gameType: g.gameType })}
                          className={chipClass(isGameActive)}
                        >
                          <span aria-hidden>{meta?.icon ?? '🎮'}</span>
                          <span className="truncate">{meta?.name ?? g.id}</span>
                        </button>
                      )
                    })}

                  {row.key === 'theme' &&
                    LOBBY_THEME_IDS.map((themeId) => {
                      const theme = LOBBY_THEMES[themeId]
                      const isThemeActive = (lobby?.theme ?? 'default') === themeId
                      const isLocked = themeId !== FREE_LOBBY_THEME && !isPremium
                      return (
                        <button
                          key={themeId}
                          type="button"
                          disabled={updatingSetting === 'theme' || isThemeActive}
                          onClick={() => {
                            if (isLocked) {
                              showToast.custom('profile.premiumFeatureLocked', '👑')
                              return
                            }
                            void applySettingUpdate('theme', { theme: themeId })
                          }}
                          title={isLocked ? '👑 Premium' : theme.name}
                          className={chipClass(isThemeActive, isLocked)}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-3 w-3 shrink-0 rounded-full border border-bd-line/50"
                            style={{ background: theme.accent }}
                          />
                          <span>{theme.name}</span>
                          {isLocked && <span aria-hidden className="shrink-0">👑</span>}
                        </button>
                      )
                    })}

                  {/* Collapse back to the value */}
                  <button
                    type="button"
                    onClick={() => setActiveSettingEditor(null)}
                    aria-label={t('common.close')}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-bd-ink-muted transition-colors hover:bg-bd-bg2 hover:text-bd-ink"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </AnimatedSettingRow>
        )
      })}
    </div>
  )
}
