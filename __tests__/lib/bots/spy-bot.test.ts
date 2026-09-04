/**
 * #813: Guess the Spy had no bots, and 51.3% of its lobbies were cancelled
 * without ever starting — 193 of the 221 cancelled lobbies whose roster
 * survived had exactly one person in them. These tests cover the thing that
 * matters for that: a lone host plus two bots must be able to play a whole
 * round without a human ever waiting on a bot.
 */

import { SpyGame, SpyGamePhase, type SpyGameData } from '@/lib/games/spy-game'
import { SpyBot } from '@/lib/bots/guess-the-spy/spy-bot'
import { SpyBotExecutor } from '@/lib/bots/guess-the-spy/spy-bot-executor'

const LOCATIONS = [
  { name: 'Airport', category: 'Travel', roles: ['Pilot', 'Passenger', 'Security Guard', 'Cleaner'] },
  { name: 'Casino', category: 'Leisure', roles: ['Dealer', 'Bouncer', 'Gambler', 'Waiter'] },
]

const BOTS = [
  { userId: 'bot-1', difficulty: 'medium' as const },
  { userId: 'bot-2', difficulty: 'medium' as const },
]

function newGame(): SpyGame {
  const game = new SpyGame('spy-bot-test')
  game.addPlayer({ id: 'human', name: 'Denys' })
  game.addPlayer({ id: 'bot-1', name: 'Intel Analyst' })
  game.addPlayer({ id: 'bot-2', name: 'Spy Cadet' })
  game.startGame()
  game.initializeRound(LOCATIONS)
  return game
}

function data(game: SpyGame): SpyGameData {
  return game.getState().data as SpyGameData
}

/** Deterministic stand-in for Math.random. */
const fixed = (value: number) => () => value

describe('SpyBot decisions', () => {
  it('readies up during role reveal, then owes nothing', () => {
    const game = newGame()
    const bot = new SpyBot(game, 'medium', 'bot-1', fixed(0))

    expect(bot.decide()).toEqual({ type: 'player-ready' })

    game.makeMove(bot.decisionToMove({ type: 'player-ready' }))
    expect(bot.decide()).toBeNull()
  })

  it('never asks itself a question', () => {
    const game = newGame()
    for (const id of ['human', 'bot-1', 'bot-2']) {
      game.makeMove({ playerId: id, type: 'player-ready', data: {}, timestamp: new Date() })
    }
    expect(data(game).phase).toBe(SpyGamePhase.QUESTIONING)

    // Hand the question to a bot regardless of who the engine picked first.
    const state = game.getState()
    ;(state.data as SpyGameData).currentQuestionerId = 'bot-1'

    const decision = new SpyBot(game, 'medium', 'bot-1', fixed(0.5)).decide()
    expect(decision).not.toBeNull()
    expect(decision).toMatchObject({ type: 'ask-question' })
    if (decision?.type === 'ask-question') {
      expect(decision.targetId).not.toBe('bot-1')
      expect(decision.question.trim().length).toBeGreaterThan(0)
    }
  })

  it('answers without naming the location, whether it is the spy or not', () => {
    const game = newGame()
    const state = game.getState()
    const d = state.data as SpyGameData
    d.phase = SpyGamePhase.QUESTIONING
    d.currentQuestionerId = 'human'
    d.currentTargetId = 'bot-1'
    d.pendingQuestion = 'How often do you end up here?'

    for (const rng of [0, 0.25, 0.5, 0.75, 0.99]) {
      const decision = new SpyBot(game, 'medium', 'bot-1', fixed(rng)).decide()
      expect(decision).toMatchObject({ type: 'answer-question' })
      if (decision?.type === 'answer-question') {
        expect(decision.answer.trim().length).toBeGreaterThan(0)
        expect(decision.answer).not.toContain(d.location)
        // A leftover template placeholder would be visible to players.
        expect(decision.answer).not.toContain('{role}')
      }
    }
  })

  it('votes for someone other than itself, exactly once', () => {
    const game = newGame()
    const d = data(game)
    d.phase = SpyGamePhase.VOTING

    const bot = new SpyBot(game, 'medium', 'bot-1', fixed(0.4))
    const decision = bot.decide()
    expect(decision).toMatchObject({ type: 'vote' })
    if (decision?.type === 'vote') {
      expect(decision.targetId).not.toBe('bot-1')
      expect(['human', 'bot-2']).toContain(decision.targetId)
    }

    d.votes['bot-1'] = 'human'
    expect(bot.decide()).toBeNull()
  })

  it('suspects the player who has given the shortest answers', () => {
    const game = newGame()
    const d = data(game)
    d.phase = SpyGamePhase.VOTING
    d.spyPlayerId = 'bot-2' // so bot-1 is a regular player and uses the heuristic
    d.questionHistory = [
      {
        askerId: 'bot-1', askerName: 'Intel Analyst',
        targetId: 'human', targetName: 'Denys',
        question: 'q', answer: 'As the pilot I am here every single working day of the week',
        timestamp: Date.now(),
      },
      {
        askerId: 'human', askerName: 'Denys',
        targetId: 'bot-2', targetName: 'Spy Cadet',
        question: 'q', answer: 'Sometimes.',
        timestamp: Date.now(),
      },
    ]

    const decision = new SpyBot(game, 'medium', 'bot-1', fixed(0)).decide()
    expect(decision).toEqual({ type: 'vote', targetId: 'bot-2' })
  })

  it('owes nothing while the game is not being played', () => {
    // Same round setup, but the game was never started — a bot must not act on
    // a lobby that is still filling up.
    const game = new SpyGame('spy-bot-waiting')
    game.addPlayer({ id: 'human', name: 'Denys' })
    game.addPlayer({ id: 'bot-1', name: 'Intel Analyst' })
    game.addPlayer({ id: 'bot-2', name: 'Spy Cadet' })
    game.initializeRound(LOCATIONS)

    expect(game.getState().status).not.toBe('playing')
    expect(new SpyBot(game, 'medium', 'bot-1', fixed(0)).decide()).toBeNull()
  })
})

describe('SpyBotExecutor.drainPendingActions', () => {
  it('leaves the round waiting only on the human', async () => {
    const game = newGame()

    const applied = await SpyBotExecutor.drainPendingActions(game, BOTS)

    expect(applied.map((m) => m.type)).toEqual(['player-ready', 'player-ready'])
    expect(data(game).playersReady.sort()).toEqual(['bot-1', 'bot-2'])
    expect(data(game).phase).toBe(SpyGamePhase.ROLE_REVEAL)

    // The human readies last, and the bots immediately carry the questioning
    // phase as far as it can go without them.
    game.makeMove({ playerId: 'human', type: 'player-ready', data: {}, timestamp: new Date() })
    expect(data(game).phase).toBe(SpyGamePhase.QUESTIONING)

    await SpyBotExecutor.drainPendingActions(game, BOTS)

    const d = data(game)
    const humanOwesSomething =
      d.currentQuestionerId === 'human' || d.currentTargetId === 'human'
    expect(humanOwesSomething).toBe(true)
  })

  it('drains a whole vote except the human', async () => {
    const game = newGame()
    const d = data(game)
    d.phase = SpyGamePhase.VOTING

    await SpyBotExecutor.drainPendingActions(game, BOTS)

    expect(Object.keys(data(game).votes).sort()).toEqual(['bot-1', 'bot-2'])
  })

  it('does nothing when the game has no bots', async () => {
    const game = newGame()
    expect(await SpyBotExecutor.drainPendingActions(game, [])).toEqual([])
    expect(data(game).playersReady).toEqual([])
  })

  it('terminates instead of spinning when a bot keeps owing an action', async () => {
    const game = newGame()
    // A bot that is not in the game can never satisfy its own decision; the
    // loop must give up rather than run forever.
    const applied = await SpyBotExecutor.drainPendingActions(game, [
      { userId: 'ghost', difficulty: 'medium' },
    ])
    expect(applied).toEqual([])
  })
})

describe('a lone host plays a full round against two bots', () => {
  it('reaches results without ever deadlocking on a bot', async () => {
    const game = new SpyGame('spy-solo-round')
    game.addPlayer({ id: 'human', name: 'Denys' })
    game.addPlayer({ id: 'bot-1', name: 'Intel Analyst' })
    game.addPlayer({ id: 'bot-2', name: 'Spy Cadet' })
    game.startGame()
    game.initializeRound(LOCATIONS)

    // Round init: bots confirm their roles, the round waits on the human.
    await SpyBotExecutor.drainPendingActions(game, BOTS)
    game.makeMove({ playerId: 'human', type: 'player-ready', data: {}, timestamp: new Date() })
    await SpyBotExecutor.drainPendingActions(game, BOTS)
    expect(data(game).phase).not.toBe(SpyGamePhase.ROLE_REVEAL)

    // Play the human's side until the round is decided. Each iteration is one
    // human action plus whatever it unlocks for the bots; the guard is a
    // failure condition, not a normal exit.
    for (let turn = 0; turn < 40; turn += 1) {
      const d = data(game)
      if (d.phase === SpyGamePhase.RESULTS) break

      let acted = false
      if (d.phase === SpyGamePhase.QUESTIONING && d.currentTargetId === 'human') {
        acted = game.makeMove({
          playerId: 'human', type: 'answer-question',
          data: { answer: 'Most days, yes.' }, timestamp: new Date(),
        })
      } else if (d.phase === SpyGamePhase.QUESTIONING && d.currentQuestionerId === 'human') {
        acted = game.makeMove({
          playerId: 'human', type: 'ask-question',
          data: { targetId: 'bot-1', question: 'How often are you here?' }, timestamp: new Date(),
        })
      } else if (d.phase === SpyGamePhase.VOTING && !('human' in d.votes)) {
        acted = game.makeMove({
          playerId: 'human', type: 'vote',
          data: { targetId: 'bot-1' }, timestamp: new Date(),
        })
      }

      // Nothing for the human to do and the round is not over: that is exactly
      // the stall this ticket is about.
      expect(acted).toBe(true)
      await SpyBotExecutor.drainPendingActions(game, BOTS)
    }

    const final = data(game)
    expect(final.phase).toBe(SpyGamePhase.RESULTS)
    expect(Object.keys(final.votes).sort()).toEqual(['bot-1', 'bot-2', 'human'])
    // Everyone scored something for the round, so the results screen has content.
    expect(Object.keys(final.scores).sort()).toEqual(['bot-1', 'bot-2', 'human'])
  })
})
