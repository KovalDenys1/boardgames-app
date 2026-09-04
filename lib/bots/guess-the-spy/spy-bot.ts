/**
 * Guess the Spy bot.
 *
 * Unlike the other bots this one is not driven by a turn index. Spy runs in
 * phases and several players can owe an action at the same time (readying up,
 * voting), so the bot answers one question instead: "given the state, what does
 * this bot owe right now?" — and returns null when it owes nothing. The server
 * loop in lib/bots/guess-the-spy/spy-bot-executor.ts drains those.
 *
 * It plays a plausible game, not a strong one. Its job is to fill the two seats
 * a lone host cannot fill: 51% of Guess the Spy lobbies were cancelled without
 * ever starting, and of the cancelled lobbies whose roster survived, 193 of 221
 * had exactly one person in them (#813).
 */

import { Move } from '@/lib/game-engine'
import { SpyGame, SpyGamePhase, type SpyGameData } from '@/lib/games/spy-game'
import { BaseBot } from '../core/base-bot'
import { BotDifficulty } from '../core/bot-types'
import {
  SPY_BOT_QUESTIONS,
  SPY_BOT_INSIDER_ANSWERS,
  SPY_BOT_BLUFF_ANSWERS,
} from './spy-question-bank'

export type SpyBotDecision =
  | { type: 'player-ready' }
  | { type: 'ask-question'; targetId: string; question: string }
  | { type: 'answer-question'; answer: string }
  | { type: 'vote'; targetId: string }
  | null

export type RandomSource = () => number

export class SpyBot extends BaseBot<SpyGame, SpyBotDecision> {
  private readonly botUserId: string
  private readonly random: RandomSource

  constructor(
    gameEngine: SpyGame,
    difficulty: BotDifficulty = 'medium',
    botUserId: string,
    random: RandomSource = Math.random
  ) {
    super(gameEngine, difficulty)
    this.botUserId = botUserId
    this.random = random
  }

  async makeDecision(): Promise<SpyBotDecision> {
    return this.decide()
  }

  /** Synchronous form — the executor drains several of these in one request. */
  decide(): SpyBotDecision {
    const state = this.gameEngine.getState()
    if (state.status !== 'playing') return null

    const data = state.data as SpyGameData
    if (!data || !this.gameEngine.getPlayers().some((p) => p.id === this.botUserId)) {
      return null
    }

    switch (data.phase) {
      case SpyGamePhase.ROLE_REVEAL:
        return data.playersReady.includes(this.botUserId) ? null : { type: 'player-ready' }

      case SpyGamePhase.QUESTIONING:
        // Answering comes first: while a question is pending the asker is
        // waiting, so nothing else can move until the target replies.
        if (data.currentTargetId === this.botUserId && data.pendingQuestion) {
          return { type: 'answer-question', answer: this.buildAnswer(data) }
        }
        if (data.currentQuestionerId === this.botUserId && !data.currentTargetId) {
          return this.buildQuestion(data)
        }
        return null

      case SpyGamePhase.VOTING:
        return this.botUserId in data.votes ? null : { type: 'vote', targetId: this.pickVote(data) }

      default:
        return null
    }
  }

  decisionToMove(decision: SpyBotDecision): Move {
    if (!decision) {
      throw new Error('Spy bot has no pending action to convert into a move')
    }

    const { type, ...rest } = decision
    return {
      playerId: this.botUserId,
      type,
      data: rest as Record<string, unknown>,
      timestamp: new Date(),
    }
  }

  evaluateState(): string {
    const data = this.gameEngine.getState().data as SpyGameData
    const isSpy = data?.spyPlayerId === this.botUserId
    return `phase=${data?.phase} role=${isSpy ? 'spy' : data?.playerRoles?.[this.botUserId]}`
  }

  private pick<T>(options: readonly T[]): T {
    return options[Math.floor(this.random() * options.length)] ?? options[0]
  }

  private otherPlayers(): { id: string; name: string }[] {
    return this.gameEngine
      .getPlayers()
      .filter((p) => p.id !== this.botUserId && p.isActive !== false)
      .map((p) => ({ id: p.id, name: p.name }))
  }

  private buildQuestion(data: SpyGameData): SpyBotDecision {
    const candidates = this.otherPlayers()
    if (candidates.length === 0) return null

    // Prefer whoever the table has heard from least — it keeps the round moving
    // and, if the bot is the spy, it is also the cheapest way to gather clues.
    const answerCounts = new Map(candidates.map((p) => [p.id, 0]))
    for (const entry of data.questionHistory) {
      const seen = answerCounts.get(entry.targetId)
      if (seen !== undefined) answerCounts.set(entry.targetId, seen + 1)
    }
    const fewest = Math.min(...answerCounts.values())
    const quietest = candidates.filter((p) => answerCounts.get(p.id) === fewest)

    return {
      type: 'ask-question',
      targetId: this.pick(quietest).id,
      question: this.pick(SPY_BOT_QUESTIONS),
    }
  }

  private buildAnswer(data: SpyGameData): string {
    const isSpy = data.spyPlayerId === this.botUserId
    if (isSpy) return this.pick(SPY_BOT_BLUFF_ANSWERS)

    const role = data.playerRoles[this.botUserId] || 'regular'
    return this.pick(SPY_BOT_INSIDER_ANSWERS).replace('{role}', role.toLowerCase())
  }

  private pickVote(data: SpyGameData): string {
    const candidates = this.otherPlayers()
    if (candidates.length === 0) return ''

    // A bot that knows it is the spy votes at random: it has no signal to use,
    // and voting for the same player every round would give it away.
    const isSpy = data.spyPlayerId === this.botUserId
    if (isSpy || this.config.difficulty === 'easy') {
      return this.pick(candidates).id
    }

    // Otherwise suspect whoever said least. Short, hedging answers are what a
    // player with no idea where they are tends to give, which is the only
    // signal available without reading the answers for meaning.
    let mostSuspicious = candidates[0]
    let lowestScore = Number.POSITIVE_INFINITY

    for (const candidate of candidates) {
      const answers = data.questionHistory.filter((entry) => entry.targetId === candidate.id)
      // Someone who has not been asked yet is not evidence of anything, so give
      // them a neutral score rather than the most suspicious one.
      const score = answers.length === 0
        ? 40
        : answers.reduce((sum, entry) => sum + entry.answer.trim().length, 0) / answers.length

      if (score < lowestScore) {
        lowestScore = score
        mostSuspicious = candidate
      }
    }

    return mostSuspicious.id
  }
}
