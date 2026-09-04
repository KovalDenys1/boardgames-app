import { AliasGame, type AliasGameData } from '@/lib/games/alias'
import type { Move, Player } from '@/lib/game-engine'

function createMove(type: string, playerId: string, payload: Record<string, unknown> = {}): Move {
  return { type, playerId, data: payload, timestamp: new Date() }
}

function getData(game: AliasGame): AliasGameData {
  return game.getState().data as AliasGameData
}

function addFourPlayers(game: AliasGame) {
  game.addPlayer({ id: 'p1', name: 'Alice', score: 0, isActive: true })
  game.addPlayer({ id: 'p2', name: 'Bob', score: 0, isActive: true })
  game.addPlayer({ id: 'p3', name: 'Carol', score: 0, isActive: true })
  game.addPlayer({ id: 'p4', name: 'Dave', score: 0, isActive: true })
}

function addThreePlayers(game: AliasGame) {
  game.addPlayer({ id: 'p1', name: 'Alice', score: 0, isActive: true })
  game.addPlayer({ id: 'p2', name: 'Bob', score: 0, isActive: true })
  game.addPlayer({ id: 'p3', name: 'Carol', score: 0, isActive: true })
}

// Starts the game AND sends start_round so the game enters turn_active.
function startRound(game: AliasGame) {
  game.startGame()
  game.makeMove(createMove('start_round', 'p1'))
}

describe('AliasGame', () => {
  describe('initialization', () => {
    it('starts with two empty teams and team_assignment phase', () => {
      const game = new AliasGame('g1')
      const data = getData(game)
      expect(data.phase).toBe('team_assignment')
      expect(data.teams).toHaveLength(2)
      expect(data.teams[0].id).toBe('team-1')
      expect(data.teams[1].id).toBe('team-2')
      expect(data.teams[0].playerIds).toHaveLength(0)
      expect(data.teams[1].playerIds).toHaveLength(0)
    })
  })

  describe('addPlayer', () => {
    it('distributes players round-robin across teams', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      const data = getData(game)
      expect(data.teams[0].playerIds).toEqual(['p1', 'p3'])
      expect(data.teams[1].playerIds).toEqual(['p2', 'p4'])
    })

    it('puts 5th player on smaller team', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      game.addPlayer({ id: 'p5', name: 'Eve', score: 0, isActive: true })
      const data = getData(game)
      // team-1 has p1,p3; team-2 has p2,p4; p5 goes to team-1 (tied, picks first)
      expect(data.teams[0].playerIds).toContain('p5')
    })
  })

  describe('startGame', () => {
    it('rejects start when fewer than 3 players', () => {
      const game = new AliasGame('g1')
      game.addPlayer({ id: 'p1', name: 'Alice', score: 0, isActive: true })
      game.addPlayer({ id: 'p2', name: 'Bob', score: 0, isActive: true })
      const result = game.startGame()
      expect(result).toBe(false)
    })

    it('starts with three, who play as three teams of one (#847)', () => {
      const game = new AliasGame('g1')
      game.addPlayer({ id: 'p1', name: 'Alice', score: 0, isActive: true })
      game.addPlayer({ id: 'p2', name: 'Bob', score: 0, isActive: true })
      game.addPlayer({ id: 'p3', name: 'Carol', score: 0, isActive: true })

      expect(game.startGame()).toBe(true)
      // A team of one has nobody to describe to, which is why four used to be
      // the minimum. Three people play as three teams instead.
      expect(game.isSoloLayout()).toBe(true)
      expect(getData(game).teams.map((t) => t.playerIds)).toEqual([['p1'], ['p2'], ['p3']])
      expect(getData(game).teams.map((t) => t.name)).toEqual(['Alice', 'Bob', 'Carol'])
    })

    it('starts the game and enters team_assignment phase', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      const result = game.startGame()
      expect(result).toBe(true)
      expect(getData(game).phase).toBe('team_assignment')
    })

    it('enters turn_active after start_round move', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      game.startGame()
      game.makeMove(createMove('start_round', 'p1'))
      const data = getData(game)
      expect(data.phase).toBe('turn_active')
      expect(data.currentCard).toHaveLength(10)
      expect(data.currentCardIndex).toBe(0)
      expect(data.turnStartedAt).not.toBeNull()
    })
  })

  describe('validateMove', () => {
    it('rejects word_action when not in turn_active phase', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      // game is still in waiting status / team_assignment phase
      expect(game.validateMove(createMove('word_action', 'p1', { action: 'guess' }))).toBe(false)
    })

    it('rejects word_action when caller is not the describer', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const data = getData(game)
      const describerId = data.teams[0].playerIds[0] // 'p1'
      const notDescriber = data.teams[0].playerIds[1]  // 'p3'
      expect(game.validateMove(createMove('word_action', notDescriber, { action: 'guess' }))).toBe(false)
      expect(game.validateMove(createMove('word_action', describerId, { action: 'guess' }))).toBe(true)
    })

    it('rejects word_action with invalid action value', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const data = getData(game)
      const describerId = data.teams[0].playerIds[0]
      expect(game.validateMove(createMove('word_action', describerId, { action: 'wrong' }))).toBe(false)
    })

    it('accepts end_turn from current describer', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const data = getData(game)
      const describerId = data.teams[0].playerIds[0]
      expect(game.validateMove(createMove('end_turn', describerId))).toBe(true)
    })

    it('rejects next_turn when not in turn_results phase', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      expect(game.validateMove(createMove('next_turn', 'p1'))).toBe(false)
    })
  })

  describe('processMove: word_action', () => {
    it('records guess and increments card index', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      const data = getData(game)
      expect(data.currentCardIndex).toBe(1)
      expect(data.currentCardResults[0].result).toBe('guessed')
    })

    it('records skip and increments card index', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      game.makeMove(createMove('word_action', describerId, { action: 'skip' }))
      const data = getData(game)
      expect(data.currentCardResults[0].result).toBe('skipped')
    })

    it('ends turn automatically after 10 word actions', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      for (let i = 0; i < 10; i++) {
        game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      }
      expect(getData(game).phase).toBe('turn_results')
    })
  })

  describe('processMove: end_turn', () => {
    it('transitions to turn_results and records lastTurnResult', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      game.makeMove(createMove('word_action', describerId, { action: 'skip' }))
      game.makeMove(createMove('end_turn', describerId))
      const data = getData(game)
      expect(data.phase).toBe('turn_results')
      expect(data.lastTurnResult).not.toBeNull()
      expect(data.lastTurnResult!.scoreDelta).toBe(0) // 1 guess - 1 skip = 0
      expect(data.teams[0].score).toBe(0)
    })

    it('calculates score correctly: 3 guessed - 1 skipped = +2', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      game.makeMove(createMove('word_action', describerId, { action: 'skip' }))
      game.makeMove(createMove('end_turn', describerId))
      expect(getData(game).teams[0].score).toBe(2)
    })

    it('advances describerIndex after turn ends', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const firstDescriberId = getData(game).teams[0].playerIds[0] // 'p1'
      game.makeMove(createMove('end_turn', firstDescriberId))
      expect(getData(game).teams[0].describerIndex).toBe(1)
    })
  })

  describe('processMove: next_turn', () => {
    function endTurn(game: AliasGame) {
      const data = getData(game)
      const team = data.teams[data.currentTeamIndex]
      const describerId = team.playerIds[team.describerIndex]
      game.makeMove(createMove('end_turn', describerId))
    }

    it('switches to the other team and deals a new card', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      endTurn(game)
      expect(getData(game).currentTeamIndex).toBe(0)
      game.makeMove(createMove('next_turn', 'p1'))
      const data = getData(game)
      expect(data.currentTeamIndex).toBe(1)
      expect(data.phase).toBe('turn_active')
      expect(data.currentCard).toHaveLength(10)
    })

    it('finishes game after all 6 turns (3 per team)', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      // 6 turns total: team0, team1, team0, team1, team0, team1
      for (let i = 0; i < 6; i++) {
        endTurn(game)
        if (i < 5) {
          game.makeMove(createMove('next_turn', 'p1'))
        }
      }
      expect(getData(game).phase).toBe('game_over')
      expect(game.getState().status).toBe('finished')
      expect(getData(game).winnerId).not.toBeNull()
    })

    it('picks winning team based on higher score', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      // Give team-1 a point on first turn
      const describerId = getData(game).teams[0].playerIds[0]
      game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      endTurn(game)
      // Advance through all remaining turns with 0 score
      for (let i = 0; i < 5; i++) {
        game.makeMove(createMove('next_turn', 'p1'))
        endTurn(game)
      }
      expect(getData(game).winnerId).toBe('team-1')
    })

    it('sets winnerId to "tie" when scores are equal', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      for (let i = 0; i < 6; i++) {
        endTurn(game)
        if (i < 5) game.makeMove(createMove('next_turn', 'p1'))
      }
      expect(getData(game).winnerId).toBe('tie')
    })
  })

  describe('applyTimeoutFallback', () => {
    it('returns changed: false when phase is not turn_active', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      // Still in team_assignment / waiting
      expect(game.applyTimeoutFallback(60).changed).toBe(false)
    })

    it('returns changed: false when timer has not expired', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const now = Date.now()
      expect(game.applyTimeoutFallback(60, now).changed).toBe(false)
    })

    it('skips remaining words and ends turn when timer expires', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const pastTime = Date.now() + 61_000 // 61s in the future = timer expired
      const result = game.applyTimeoutFallback(60, pastTime)
      expect(result.changed).toBe(true)
      expect(getData(game).phase).toBe('turn_results')
      expect(getData(game).lastTurnResult!.wordResults).toHaveLength(10)
      expect(getData(game).lastTurnResult!.wordResults.every(r => r.result === 'skipped')).toBe(true)
    })

    it('correctly scores a partial card (5 guessed, then timeout)', () => {
      const game = new AliasGame('g1')
      addFourPlayers(game)
      startRound(game)
      const describerId = getData(game).teams[0].playerIds[0]
      // Process 5 guesses manually
      for (let i = 0; i < 5; i++) {
        game.makeMove(createMove('word_action', describerId, { action: 'guess' }))
      }
      // Now trigger timeout
      const pastTime = Date.now() + 61_000
      const result = game.applyTimeoutFallback(60, pastTime)
      expect(result.changed).toBe(true)
      const data = getData(game)
      expect(data.phase).toBe('turn_results')
      expect(data.lastTurnResult!.wordResults).toHaveLength(10)
      const guessed = data.lastTurnResult!.wordResults.filter(r => r.result === 'guessed').length
      const skipped = data.lastTurnResult!.wordResults.filter(r => r.result === 'skipped').length
      expect(guessed).toBe(5)
      expect(skipped).toBe(5)
      expect(data.teams[0].score).toBe(0) // 5 guessed - 5 skipped = 0
    })
  })
})

describe('AliasGame with three players (#847)', () => {
  it('refuses manual team switching, since every team is one player', () => {
    const game = new AliasGame('g1')
    addThreePlayers(game)
    game.startGame()

    // Accepting this would leave whoever moved with an empty team and give
    // someone else two players, which is the 2v1 split that cannot be played.
    expect(game.makeMove(createMove('assign_team', 'p1', { teamId: 'team-2' }))).toBe(false)
    expect(getData(game).teams.map((t) => t.playerIds)).toEqual([['p1'], ['p2'], ['p3']])
  })

  it('rotates the describer across all three and scores each of them', () => {
    const game = new AliasGame('g1')
    addThreePlayers(game)
    startRound(game)

    const describers: string[] = []
    for (let turn = 0; turn < 3; turn += 1) {
      const data = getData(game)
      const team = data.teams[data.currentTeamIndex]
      const describerId = team.playerIds[team.describerIndex]
      describers.push(describerId)

      // One guessed word, then hand over.
      expect(game.makeMove(createMove('word_action', describerId, { action: 'guess' }))).toBe(true)
      expect(game.makeMove(createMove('end_turn', describerId))).toBe(true)
      if (getData(game).phase === 'turn_results') {
        expect(game.makeMove(createMove('next_turn', describerId))).toBe(true)
      }
    }

    // Everyone describes, and the point goes to whoever was describing.
    expect(describers).toEqual(['p1', 'p2', 'p3'])
    expect(getData(game).teams.map((t) => t.score)).toEqual([1, 1, 1])
  })

  it('lets the third team win, which the old two-team check made impossible', () => {
    const game = new AliasGame('g1')
    addThreePlayers(game)
    startRound(game)

    // _finishGame used to destructure [team1, team2], so a third team could
    // never win no matter what it scored.
    const data = getData(game)
    data.teams[0].score = 2
    data.teams[1].score = 3
    data.teams[2].score = 9
    // Everyone else is done; the last turn of the game belongs to team-3.
    for (const team of data.teams) data.teamTurnCounts[team.id] = data.turnsPerTeam
    data.teamTurnCounts[data.teams[2].id] = data.turnsPerTeam - 1
    data.currentTeamIndex = 2

    game.makeMove(createMove('end_turn', 'p3'))

    expect(getData(game).phase).toBe('game_over')
    expect(getData(game).winnerId).toBe('team-3')
    expect(game.getState().winner).toBe('p3')
  })
  it('calls a three-way draw a tie', () => {
    const game = new AliasGame('g1')
    addThreePlayers(game)
    startRound(game)

    const data = getData(game)
    for (const team of data.teams) {
      team.score = 4
      data.teamTurnCounts[team.id] = data.turnsPerTeam
    }
    data.teamTurnCounts[data.teams[2].id] = data.turnsPerTeam - 1
    data.currentTeamIndex = 2

    game.makeMove(createMove('end_turn', 'p3'))

    expect(getData(game).winnerId).toBe('tie')
    expect(game.getState().winner).toBeUndefined()
  })
})
