import { render, screen, fireEvent } from '@testing-library/react'
import GameTabs from '@/components/game-chrome/GameTabs'

describe('GameTabs (#736 phase 5)', () => {
  const tabs = [
    { id: 'board' as const, label: 'Board' },
    { id: 'moves' as const, label: 'Moves (3)' },
    { id: 'chat' as const, label: 'Chat', badge: 2 },
  ]

  it('renders tabs, marks the active one, and fires onTabChange', () => {
    const onTabChange = jest.fn()
    render(<GameTabs tabs={tabs} activeTab="board" onTabChange={onTabChange} />)
    expect(screen.getByText('Board').className).toContain('game-tab-active')
    fireEvent.click(screen.getByText('Moves (3)'))
    expect(onTabChange).toHaveBeenCalledWith('moves')
  })

  it('shows the unread badge only on inactive tabs with badge > 0', () => {
    const { rerender } = render(<GameTabs tabs={tabs} activeTab="board" onTabChange={jest.fn()} />)
    expect(screen.getByText('2')).toBeTruthy()
    rerender(<GameTabs tabs={tabs} activeTab="chat" onTabChange={jest.fn()} />)
    expect(screen.queryByText('2')).toBeNull()
    rerender(<GameTabs tabs={[{ id: 'board' as const, label: 'Board' }, { id: 'chat' as const, label: 'Chat', badge: 0 }]} activeTab="board" onTabChange={jest.fn()} />)
    expect(screen.queryByText('0')).toBeNull()
  })
})
