import { getLobbyPlayerRequirements } from '@/lib/lobby-player-requirements'

describe('getLobbyPlayerRequirements', () => {
  it('returns bot-friendly requirements for yahtzee', () => {
    const requirements = getLobbyPlayerRequirements('yahtzee')

    expect(requirements).toEqual({
      gameType: 'yahtzee',
      supportsBots: true,
      minPlayersRequired: 1,
      desiredPlayerCount: 2,
    })
  })

  it('returns strict minimum requirements for non-bot games', () => {
    const requirements = getLobbyPlayerRequirements('alias')

    expect(requirements).toEqual({
      gameType: 'alias',
      supportsBots: false,
      minPlayersRequired: 4,
      desiredPlayerCount: 4,
    })
  })

  // Spy keeps its three-player minimum now that it has bots — the difference is
  // that a lone host can reach it by filling the other two seats (#813).
  it('keeps the three-player minimum for Spy and marks it bot-capable', () => {
    expect(getLobbyPlayerRequirements('guess_the_spy')).toEqual({
      gameType: 'guess_the_spy',
      supportsBots: true,
      minPlayersRequired: 3,
      desiredPlayerCount: 3,
    })
  })

  it('keeps two-player requirement for bot-enabled duel games', () => {
    const requirements = getLobbyPlayerRequirements('tic_tac_toe')

    expect(requirements).toEqual({
      gameType: 'tic_tac_toe',
      supportsBots: true,
      minPlayersRequired: 2,
      desiredPlayerCount: 2,
    })
  })

  it('keeps two-player requirement for bot-enabled memory game', () => {
    const requirements = getLobbyPlayerRequirements('memory')

    expect(requirements).toEqual({
      gameType: 'memory',
      supportsBots: true,
      minPlayersRequired: 2,
      desiredPlayerCount: 2,
    })
  })

  it('uses default game type when input is empty', () => {
    const requirements = getLobbyPlayerRequirements('   ')

    expect(requirements).toEqual({
      gameType: 'yahtzee',
      supportsBots: true,
      minPlayersRequired: 1,
      desiredPlayerCount: 2,
    })
  })

  it('falls back to safe defaults for unknown game type', () => {
    const requirements = getLobbyPlayerRequirements('unknown_game')

    expect(requirements).toEqual({
      gameType: 'unknown_game',
      supportsBots: false,
      minPlayersRequired: 2,
      desiredPlayerCount: 2,
    })
  })
})
