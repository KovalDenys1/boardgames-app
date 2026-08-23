import { render, screen } from '@testing-library/react'
import GamePlayerCard from '@/components/game-chrome/GamePlayerCard'

jest.mock('@/lib/i18n-helpers', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('GamePlayerCard (#736 phase 3)', () => {
  const base = {
    name: 'Alice',
    isActive: false,
    isMe: false,
    isWinner: false,
    side: 'left' as const,
    accentColor: 'var(--bd-mint)',
  }

  it('shows "Your turn" on the active local player card', () => {
    render(<GamePlayerCard {...base} isActive isMe />)
    expect(screen.getByText('game.ui.yourTurn')).toBeTruthy()
    expect(screen.queryByText('game.ui.theirTurn')).toBeNull()
  })

  it("shows \"Their turn\" on the opponent's active card (the old Memory bug)", () => {
    render(<GamePlayerCard {...base} isActive isMe={false} />)
    expect(screen.getByText('game.ui.theirTurn')).toBeTruthy()
    expect(screen.queryByText('game.ui.yourTurn')).toBeNull()
  })

  it('shows no turn indicator when inactive', () => {
    render(<GamePlayerCard {...base} />)
    expect(screen.queryByText('game.ui.yourTurn')).toBeNull()
    expect(screen.queryByText('game.ui.theirTurn')).toBeNull()
  })

  it('renders win badge and premium crown', () => {
    render(<GamePlayerCard {...base} isWinner isPremium />)
    expect(screen.getByText('game.ui.winBadge')).toBeTruthy()
    expect(screen.getByTitle('Premium')).toBeTruthy()
  })

  it('renders the subline and avatar-initial fallback', () => {
    render(<GamePlayerCard {...base} subline="3W" />)
    expect(screen.getByText('3W')).toBeTruthy()
    expect(screen.getByText('A')).toBeTruthy()
  })
})
