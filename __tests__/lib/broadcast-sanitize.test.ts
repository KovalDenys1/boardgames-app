import { sanitizeStateForBroadcast } from '@/lib/broadcast-sanitize'

describe('sanitizeStateForBroadcast dispatcher', () => {
  it('routes sketch_and_guess to the sketch sanitizer and strips the live prompt', () => {
    const state = {
      status: 'playing',
      data: {
        phase: 'drawing',
        currentRound: 1,
        rounds: [{ round: 1, drawerId: 'player1', prompt: 'castle' }],
      },
    }

    const forGuesser = sanitizeStateForBroadcast('sketch_and_guess', state, 'player2')
    expect((forGuesser.data as { rounds: Array<{ prompt: string }> }).rounds[0].prompt).toBe('')

    const forDrawer = sanitizeStateForBroadcast('sketch_and_guess', state, 'player1')
    expect((forDrawer.data as { rounds: Array<{ prompt: string }> }).rounds[0].prompt).toBe('castle')
  })

  it('passes state through unchanged for a game type with no registered sanitizer', () => {
    const state = { status: 'playing', data: { secret: 'visible-on-purpose' } }
    const result = sanitizeStateForBroadcast('tic_tac_toe', state, null)
    expect(result).toBe(state)
  })
})
