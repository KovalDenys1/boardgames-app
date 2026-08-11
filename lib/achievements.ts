export type AchievementCategory = 'progression' | 'skill' | 'social' | 'special'

export interface AchievementDefinition {
  key: string
  icon: string
  category: AchievementCategory
}

/**
 * Achievement definitions live in code rather than a DB table (matching
 * lib/game-registry.ts / lib/game-catalog.ts's pattern for other content
 * catalogs) — display name/description are translated via t('achievements.<key>.name'
 * / '.description'), not stored here, per this project's no-hardcoded-strings rule.
 *
 * Unlock conditions live in lib/achievement-engine.ts, next to the queries
 * that evaluate them.
 */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { key: 'first_win', icon: '🏆', category: 'progression' },
  { key: 'on_a_roll', icon: '🔥', category: 'skill' },
  { key: 'veteran', icon: '🎖️', category: 'progression' },
  { key: 'champion', icon: '👑', category: 'progression' },
  { key: 'game_explorer', icon: '🗺️', category: 'special' },
  { key: 'social_butterfly', icon: '🦋', category: 'social' },
  { key: 'speed_demon', icon: '⚡', category: 'skill' },
]

export const ACHIEVEMENT_KEYS: readonly string[] = ACHIEVEMENTS.map((a) => a.key)

export function getAchievementByKey(key: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key)
}
