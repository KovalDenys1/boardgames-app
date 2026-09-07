import type { IconName } from '@/components/icons/names'

export type AchievementCategory = 'progression' | 'skill' | 'social' | 'special'

export interface AchievementDefinition {
  key: string
  /** A chrome icon name — never an emoji (DESIGN.md "Icons"). */
  icon: IconName
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
  { key: 'first_win', icon: 'trophy', category: 'progression' },
  { key: 'on_a_roll', icon: 'flame', category: 'skill' },
  { key: 'veteran', icon: 'medal', category: 'progression' },
  { key: 'champion', icon: 'crown', category: 'progression' },
  { key: 'game_explorer', icon: 'map', category: 'special' },
  { key: 'social_butterfly', icon: 'butterfly', category: 'social' },
  { key: 'speed_demon', icon: 'bolt', category: 'skill' },
]

export const ACHIEVEMENT_KEYS: readonly string[] = ACHIEVEMENTS.map((a) => a.key)

export function getAchievementByKey(key: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key)
}
