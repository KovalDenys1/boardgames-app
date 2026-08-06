import type { TranslationKeys } from '@/lib/i18n-helpers'

export type TourStepPlacement = 'center' | 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  id: string
  /** Route to navigate to for this step. null = stay on the current route. */
  route: string | null
  /** CSS selector for the spotlight target. null = centered card, no highlight. */
  selector: string | null
  placement: TourStepPlacement
  authOnly?: boolean
  titleKey: TranslationKeys
  descriptionKey: TranslationKeys
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: null,
    selector: null,
    placement: 'center',
    titleKey: 'tour.welcome.title',
    descriptionKey: 'tour.welcome.description',
  },
  {
    id: 'games',
    route: '/games',
    selector: '[data-tour-step="games-grid"]',
    placement: 'bottom',
    titleKey: 'tour.games.title',
    descriptionKey: 'tour.games.description',
  },
  {
    id: 'create-lobby',
    route: '/lobby',
    selector: '[data-tour-step="create-lobby"]',
    placement: 'bottom',
    titleKey: 'tour.createLobby.title',
    descriptionKey: 'tour.createLobby.description',
  },
  {
    id: 'find-lobbies',
    route: '/lobby',
    selector: '[data-tour-step="filter-bar"]',
    placement: 'bottom',
    titleKey: 'tour.findLobbies.title',
    descriptionKey: 'tour.findLobbies.description',
  },
  {
    id: 'profile',
    route: '/profile',
    selector: '[data-tour-step="stats-cards"]',
    placement: 'bottom',
    authOnly: true,
    titleKey: 'tour.profile.title',
    descriptionKey: 'tour.profile.description',
  },
  {
    id: 'quick-start',
    route: null,
    selector: null,
    placement: 'center',
    titleKey: 'tour.quickStart.title',
    descriptionKey: 'tour.quickStart.description',
  },
]
