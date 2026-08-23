import { render, screen } from '@testing-library/react'
import GameStatusBanner from '@/components/game-chrome/GameStatusBanner'

jest.mock('@/lib/i18n-helpers', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('GameStatusBanner (#736 phase 4)', () => {
  const base = {
    isFinished: false,
    activeTitle: "Alice's turn",
    secs: 45,
    turnTimerLimit: 60,
    barColor: 'var(--bd-mint)',
  }

  it('renders the active-turn banner with timer and meta', () => {
    render(<GameStatusBanner {...base} meta="#5" />)
    expect(screen.getByText("Alice's turn")).toBeTruthy()
    expect(screen.getByText('#5')).toBeTruthy()
    expect(screen.getByText(':45')).toBeTruthy()
  })

  it('renders the victory plate when finished', () => {
    render(<GameStatusBanner {...base} isFinished finishedMessage="Alice wins!" />)
    expect(screen.getByText('game.ui.victoryBadge')).toBeTruthy()
    expect(screen.getByText('Alice wins!')).toBeTruthy()
    expect(screen.queryByText(':45')).toBeNull()
  })

  it('renders the draw plate when finished with a draw', () => {
    render(<GameStatusBanner {...base} isFinished isDraw finishedMessage="It's a tie" />)
    expect(screen.getByText('game.ui.drawBadge')).toBeTruthy()
    expect(screen.getByText("It's a tie")).toBeTruthy()
  })

  it('renders the spectator variant without a timer', () => {
    render(<GameStatusBanner {...base} isSpectator />)
    expect(screen.getByText('game.ui.spectatingBadge')).toBeTruthy()
    expect(screen.getByText('👁')).toBeTruthy()
    expect(screen.queryByText(':45')).toBeNull()
  })
})
