import { fireEvent, render, screen } from '@testing-library/react'
import GameRoomCard from '@/components/game-chrome/GameRoomCard'
import { showToast } from '@/lib/i18n-toast'

jest.mock('@/lib/i18n-helpers', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
jest.mock('@/lib/i18n-toast', () => ({ showToast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/components/LeaveIcon', () => ({ __esModule: true, default: () => <span data-testid="leave-icon" /> }))

describe('GameRoomCard', () => {
  it('shows the game and room, copies the spectate link when spectators are allowed, and offers Leave', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const onLeave = jest.fn()

    render(<GameRoomCard gameId="rps" title="Rock Paper Scissors" code="1311" leaveLabel="Leave" onLeave={onLeave} allowSpectators />)

    expect(screen.getByText('Rock Paper Scissors')).toBeTruthy()
    expect(screen.getByText('#1311')).toBeTruthy()

    // A running game cannot be joined; the link worth sharing is the spectate one.
    fireEvent.click(screen.getByRole('button', { name: 'game.ui.inviteSpectators' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/lobby\/1311\/spectate$/))
    await Promise.resolve()
    expect(showToast.success).toHaveBeenCalledWith('toast.linkCopied')

    fireEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('gives a spectator a link back to the lobby instead of Leave', () => {
    render(<GameRoomCard gameId="rps" title="RPS" code="1311" leaveLabel="Leave" isSpectator />)
    expect(screen.getByRole('link', { name: 'game.ui.backToLobby' }).getAttribute('href')).toBe('/lobby/1311')
    expect(screen.queryByRole('button', { name: 'Leave' })).toBeNull()
  })

  it('says spectators are off instead of offering a link that dead-ends', () => {
    render(<GameRoomCard gameId="rps" title="RPS" code="1311" leaveLabel="Leave" onLeave={() => {}} />)
    expect(screen.getByText('game.ui.spectatorsOff')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'game.ui.inviteSpectators' })).toBeNull()
  })

  it('compact form keeps only the icon controls', () => {
    render(<GameRoomCard gameId="rps" title="RPS" code="1311" leaveLabel="Leave" onLeave={() => {}} allowSpectators compact />)
    expect(screen.queryByText('RPS')).toBeNull()
    expect(screen.getByRole('button', { name: 'game.ui.inviteSpectators' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Leave' })).toBeTruthy()
  })
})
