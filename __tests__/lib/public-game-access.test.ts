import {
  getGameLobbiesRoute,
  getLobbyCreateRoute,
  isTemporarilyUnavailableGameType,
  getPublicRegisteredGameTypes,
} from '@/lib/public-game-access'

describe('public game access helpers', () => {
  it('maps supported lobby routes to the correct slug pages', () => {
    expect(getGameLobbiesRoute('yahtzee')).toBe('/games/yahtzee/lobbies')
    expect(getGameLobbiesRoute('guess_the_spy')).toBe('/games/spy/lobbies')
    expect(getGameLobbiesRoute('tic_tac_toe')).toBe('/games/tic-tac-toe/lobbies')
    expect(getGameLobbiesRoute('memory')).toBe('/games/memory/lobbies')
    expect(getGameLobbiesRoute('liars_party')).toBe('/games/liars-party/lobbies')
    expect(getGameLobbiesRoute('sketch_and_guess')).toBe('/games/sketch-and-guess/lobbies')
  })

  it('builds game-specific lobby creation routes', () => {
    expect(getLobbyCreateRoute('yahtzee')).toBe('/lobby/create?gameType=yahtzee')
    expect(getLobbyCreateRoute('guess_the_spy')).toBe('/lobby/create?gameType=guess_the_spy')
    expect(getLobbyCreateRoute(null)).toBeNull()
  })

  it('marks coming-soon games as temporarily unavailable', () => {
    // Liar's Party is still in-development (#872); RPS went public in #870
    expect(isTemporarilyUnavailableGameType('rock_paper_scissors')).toBe(false)
    expect(isTemporarilyUnavailableGameType('liars_party')).toBe(true)
    expect(isTemporarilyUnavailableGameType('alias')).toBe(false)
    expect(isTemporarilyUnavailableGameType('yahtzee')).toBe(false)
    expect(isTemporarilyUnavailableGameType(undefined)).toBe(false)
    // Sketch & Guess has a live lobbies route but is gated behind
    // ENABLE_SKETCH_AND_GUESS, which is off here — without it in the route map
    // the page would offer a create button that lands on the default game (#871)
    expect(isTemporarilyUnavailableGameType('sketch_and_guess')).toBe(true)
  })

  it('getPublicRegisteredGameTypes returns currently available games', () => {
    const publicTypes = getPublicRegisteredGameTypes()
    expect(publicTypes).toContain('yahtzee')
    expect(publicTypes).toContain('guess_the_spy')
    expect(publicTypes).toContain('tic_tac_toe')
    expect(publicTypes).toContain('memory')
    expect(publicTypes).toContain('alias')
    // LP excluded while in-development; RPS is public (#870)
    expect(publicTypes).toContain('rock_paper_scissors')
    expect(publicTypes).not.toContain('liars_party')
  })
})
