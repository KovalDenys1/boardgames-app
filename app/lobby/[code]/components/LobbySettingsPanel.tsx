import { useMemo, useState } from 'react'
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
          <span aria-hidden>⚙</span>
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
        return (
          <div key={row.key}>
            <button
              type="button"
              onClick={() => openEditor(row.key)}
              disabled={!canEditLobbySettings}
              aria-expanded={canEditLobbySettings ? isActive : undefined}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors sm:px-4 ${
                isActive
                  ? 'border-bd-mint/60 bg-bd-mint/12'
                  : 'border-bd-line bg-bd-card-warm'
              } ${canEditLobbySettings ? 'cursor-pointer hover:border-bd-ink' : 'cursor-default'}`}
            >
              <span aria-hidden className="flex w-6 shrink-0 items-center justify-center text-base">{row.icon}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-bd-ink">{row.label}</span>
              <span className={`shrink-0 text-xs font-semibold ${isActive ? 'text-bd-mint-deep' : 'text-bd-ink-soft'}`}>{row.value}</span>
              {canEditLobbySettings && (
                <span className={`shrink-0 text-bd-ink-muted transition-transform duration-150 ${isActive ? 'rotate-90' : ''}`}>›</span>
              )}
            </button>

            {/* Inline editor under the active row */}
            {canEditLobbySettings && isActive && (
              <div className="mt-1.5 rounded-xl border border-bd-mint/45 bg-bd-mint/10 px-3 py-3">
                {row.key === 'maxPlayers' && (
                  <div className="flex flex-wrap gap-2">
                    {maxPlayersOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={updatingSetting === 'maxPlayers' || value === maxPlayers}
                        onClick={() => void applySettingUpdate('maxPlayers', { maxPlayers: value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          value === maxPlayers
                            ? 'border-bd-ink bg-bd-ink text-bd-bg'
                            : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}

                {row.key === 'turnTimer' && (
                  <div className="flex flex-wrap gap-2">
                    {turnTimerOptions.map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        disabled={updatingSetting === 'turnTimer' || seconds === lobby?.turnTimer}
                        onClick={() => void applySettingUpdate('turnTimer', { turnTimer: seconds })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          seconds === lobby?.turnTimer
                            ? 'border-bd-ink bg-bd-ink text-bd-bg'
                            : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                )}

                {row.key === 'allowSpectators' && (
                  <>
                    <div className="flex flex-wrap gap-2">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          lobby?.allowSpectators
                            ? 'border-bd-ink bg-bd-ink text-bd-bg'
                            : !isPremium
                              ? 'border-bd-line bg-bd-bg2 text-bd-ink-muted opacity-60'
                              : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {t('common.enabled')}{!isPremium && ' 👑'}
                      </button>
                      <button
                        type="button"
                        disabled={updatingSetting === 'allowSpectators' || lobby?.allowSpectators === false}
                        onClick={() => void applySettingUpdate('allowSpectators', { allowSpectators: false })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          lobby?.allowSpectators === false
                            ? 'border-bd-ink bg-bd-ink text-bd-bg'
                            : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {t('common.disabled')}
                      </button>
                    </div>
                    {lobby?.allowSpectators && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold text-bd-mint-deep">{t('lobby.maxSpectatorsLabel')}</p>
                        <div className="flex flex-wrap gap-2">
                          {([0, 5, 10, 20] as const).map((limit) => {
                            const current = lobby?.maxSpectators ?? 0
                            const isLimitActive = current === limit
                            return (
                              <button
                                key={limit}
                                type="button"
                                disabled={updatingSetting === 'allowSpectators' || isLimitActive}
                                onClick={() => void applySettingUpdate('allowSpectators', { maxSpectators: limit })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  isLimitActive
                                    ? 'border-bd-ink bg-bd-ink text-bd-bg'
                                    : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {limit === 0 ? t('lobby.maxSpectatorsUnlimited') : String(limit)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {row.key === 'gameType' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {availableGames.map((g) => {
                      const meta = g.gameType ? getGameMetadata(g.gameType) : null
                      const isGameActive = g.gameType === lobby?.gameType
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={updatingSetting === 'gameType' || isGameActive}
                          onClick={() => g.gameType && void applySettingUpdate('gameType', { gameType: g.gameType })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            isGameActive
                              ? 'border-bd-ink bg-bd-ink text-bd-bg'
                              : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span>{meta?.icon ?? '🎮'}</span>
                          <span className="truncate">{meta?.name ?? g.id}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {row.key === 'theme' && (
                  <div className="flex flex-wrap gap-2">
                    {LOBBY_THEME_IDS.map((themeId) => {
                      const theme = LOBBY_THEMES[themeId]
                      const isThemeActive = (lobby?.theme ?? 'default') === themeId
                      const isPremiumTheme = themeId !== FREE_LOBBY_THEME
                      const isLocked = isPremiumTheme && !isPremium
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
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isThemeActive
                              ? 'border-bd-ink bg-bd-ink text-bd-bg'
                              : isLocked
                                ? 'border-bd-line bg-bd-bg2 text-bd-ink-muted cursor-not-allowed opacity-60'
                                : 'border-bd-line bg-bd-card-warm text-bd-ink hover:border-bd-ink'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-bd-line/50 shrink-0"
                            style={{ background: theme.accent }}
                          />
                          <span>{theme.name}</span>
                          {isLocked && <span className="shrink-0">👑</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
