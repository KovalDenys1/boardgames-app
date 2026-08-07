import { sanitizeStateForBroadcast } from '@/lib/broadcast-sanitize'

type StateLike = { status?: string; data?: unknown }

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

  it('passes state through unchanged for a game that declares no hidden state', () => {
    const state = { status: 'playing', data: { board: ['x', 'o'] } }
    expect(sanitizeStateForBroadcast('tic_tac_toe', state, null)).toBe(state)
  })

  it('passes state through unchanged for an unknown game type', () => {
    const state = { status: 'playing', data: { anything: true } }
    expect(sanitizeStateForBroadcast('not_a_real_game', state, null)).toBe(state)
  })
})

describe('memory sanitization (#715)', () => {
  const buildState = (): StateLike => ({
    status: 'playing',
    data: {
      cards: [
        { id: 'a', value: '🍎', isFlipped: true, isMatched: false },
        { id: 'b', value: '🍊', isFlipped: false, isMatched: true },
        { id: 'c', value: '🍋', isFlipped: false, isMatched: false },
        { id: 'd', value: '🍌', isFlipped: false, isMatched: false },
      ],
      moveHistory: [{ playerId: 'p1', card1Value: '🍇', card2Value: '🍓', isMatch: false }],
    },
  })

  const cardsOf = (state: StateLike) => (state.data as { cards: Array<{ id: string; value: string }> }).cards

  it('redacts the value of every face-down, unmatched card', () => {
    const result = sanitizeStateForBroadcast('memory', buildState(), null)
    const cards = cardsOf(result)

    expect(cards.find((c) => c.id === 'c')?.value).toBe('')
    expect(cards.find((c) => c.id === 'd')?.value).toBe('')
  })

  it('keeps values the table can already see (flipped or matched)', () => {
    const result = sanitizeStateForBroadcast('memory', buildState(), null)
    const cards = cardsOf(result)

    expect(cards.find((c) => c.id === 'a')?.value).toBe('🍎')
    expect(cards.find((c) => c.id === 'b')?.value).toBe('🍊')
  })

  it('redacts for the player whose turn it is too — there is no viewer exception', () => {
    const forActivePlayer = sanitizeStateForBroadcast('memory', buildState(), 'p1')
    expect(cardsOf(forActivePlayer).find((c) => c.id === 'c')?.value).toBe('')
  })

  it('does not mutate the source state', () => {
    const state = buildState()
    sanitizeStateForBroadcast('memory', state, null)
    expect(cardsOf(state).find((c) => c.id === 'c')?.value).toBe('🍋')
  })

  it('leaves already-public move history intact', () => {
    const result = sanitizeStateForBroadcast('memory', buildState(), null)
    const history = (result.data as { moveHistory: Array<{ card1Value: string }> }).moveHistory
    expect(history[0].card1Value).toBe('🍇')
  })
})

describe('alias sanitization (#716)', () => {
  const buildState = (phase = 'turn_active'): StateLike => ({
    status: 'playing',
    data: {
      phase,
      currentTeamIndex: 0,
      currentCardIndex: 0,
      currentCard: ['bridge', 'kettle', 'anchor'],
      currentCardResults: [{ word: 'ladder', result: 'guessed' }],
      teams: [
        { id: 'team-1', playerIds: ['describer', 'teammate'], describerIndex: 0 },
        { id: 'team-2', playerIds: ['opponent'], describerIndex: 0 },
      ],
    },
  })

  const cardOf = (state: StateLike) => (state.data as { currentCard: string[] | null }).currentCard

  it('hides the word card from a guesser on the describing team', () => {
    expect(cardOf(sanitizeStateForBroadcast('alias', buildState(), 'teammate'))).toBeNull()
  })

  it('hides the word card from the opposing team', () => {
    expect(cardOf(sanitizeStateForBroadcast('alias', buildState(), 'opponent'))).toBeNull()
  })

  it('hides the word card on a shared broadcast with no viewer', () => {
    expect(cardOf(sanitizeStateForBroadcast('alias', buildState(), null))).toBeNull()
  })

  it('still shows the word card to the describer', () => {
    expect(cardOf(sanitizeStateForBroadcast('alias', buildState(), 'describer'))).toEqual([
      'bridge',
      'kettle',
      'anchor',
    ])
  })

  it('leaves state alone outside an active turn', () => {
    const state = buildState('turn_results')
    expect(sanitizeStateForBroadcast('alias', state, 'opponent')).toBe(state)
  })

  it('keeps already-resolved words visible', () => {
    const result = sanitizeStateForBroadcast('alias', buildState(), 'opponent')
    const results = (result.data as { currentCardResults: Array<{ word: string }> }).currentCardResults
    expect(results[0].word).toBe('ladder')
  })
})

describe('fake_artist sanitization (#716)', () => {
  const buildState = (phase = 'drawing', status = 'playing'): StateLike => ({
    status,
    data: {
      phase,
      fakeArtistId: 'impostor',
      promptFingerprint: 'lighthouse',
      playerOrder: ['impostor', 'honest'],
      roundResults: [{ round: 1, fakeArtistId: 'honest' }],
    },
  })

  const fakeIdOf = (state: StateLike) => (state.data as { fakeArtistId: string }).fakeArtistId

  it('hides the impostor from an honest player', () => {
    const result = sanitizeStateForBroadcast('fake_artist', buildState(), 'honest')
    expect(fakeIdOf(result)).toBe('')
    expect((result.data as { promptFingerprint: string }).promptFingerprint).toBe('')
  })

  it('hides the impostor on a shared broadcast with no viewer', () => {
    expect(fakeIdOf(sanitizeStateForBroadcast('fake_artist', buildState(), null))).toBe('')
  })

  it('still tells the fake artist who they are', () => {
    expect(fakeIdOf(sanitizeStateForBroadcast('fake_artist', buildState(), 'impostor'))).toBe('impostor')
  })

  it('reveals the impostor to everyone at the reveal phase', () => {
    const state = buildState('reveal')
    expect(sanitizeStateForBroadcast('fake_artist', state, 'honest')).toBe(state)
  })

  it('reveals the impostor once the game is finished', () => {
    const state = buildState('voting', 'finished')
    expect(sanitizeStateForBroadcast('fake_artist', state, 'honest')).toBe(state)
  })

  it('keeps already-revealed past rounds intact', () => {
    const result = sanitizeStateForBroadcast('fake_artist', buildState(), 'honest')
    const rounds = (result.data as { roundResults: Array<{ fakeArtistId: string }> }).roundResults
    expect(rounds[0].fakeArtistId).toBe('honest')
  })
})
