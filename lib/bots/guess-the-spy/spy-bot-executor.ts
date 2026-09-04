import { Move } from '@/lib/game-engine'
import { SpyGame } from '@/lib/games/spy-game'
import { BotDifficulty, MoveCallback } from '../core/bot-types'
import { SpyBot } from './spy-bot'
import { clientLogger } from '@/lib/client-logger'

export interface SpyBotActionEvent {
  type: 'thinking' | 'question' | 'answer' | 'vote' | 'ready'
  botName?: string
  message: string
}

/**
 * Safety net for the drain loop below. A full round of three bots costs well
 * under this; anything approaching it means a decision is not being consumed
 * and the loop would otherwise spin.
 */
const MAX_BOT_ACTIONS_PER_DRAIN = 30

const EVENT_TYPE_BY_MOVE: Record<string, SpyBotActionEvent['type']> = {
  'player-ready': 'ready',
  'ask-question': 'question',
  'answer-question': 'answer',
  vote: 'vote',
}

export interface SpyBotParticipant {
  userId: string
  difficulty: BotDifficulty
}

export class SpyBotExecutor {
  /**
   * Apply every action the bots currently owe, in order, against the live
   * engine. Spy is phase-based rather than turn-based, so more than one bot can
   * owe something at once (readying up, voting) and one bot's action can create
   * another's (a bot asks, another bot answers). The loop drains until the only
   * thing outstanding belongs to a human.
   *
   * The caller is responsible for persisting the resulting state; `onMove` is
   * called per applied move so it can broadcast progress.
   */
  static async drainPendingActions(
    gameEngine: SpyGame,
    bots: SpyBotParticipant[],
    onMove?: MoveCallback,
    onBotAction?: (event: SpyBotActionEvent) => void,
  ): Promise<Move[]> {
    if (bots.length === 0) return []

    const applied: Move[] = []

    for (let i = 0; i < MAX_BOT_ACTIONS_PER_DRAIN; i += 1) {
      const next = SpyBotExecutor.nextAction(gameEngine, bots)
      if (!next) break

      const { move, botName } = next
      if (!gameEngine.makeMove(move)) {
        clientLogger.warn('🤖 [SPY-BOT] Engine rejected a bot move, stopping drain', {
          type: move.type,
          playerId: move.playerId,
        })
        break
      }

      applied.push(move)
      onBotAction?.({
        type: EVENT_TYPE_BY_MOVE[move.type] ?? 'thinking',
        botName,
        message: `${botName} ${SpyBotExecutor.describe(move)}`,
      })
      await onMove?.(move)
    }

    return applied
  }

  /** Execute a single pending action, for the shared bot-turn endpoint. */
  static async executeBotTurn(
    gameEngine: SpyGame,
    botUserId: string,
    difficulty: BotDifficulty,
    onMove: MoveCallback,
    onBotAction?: (event: SpyBotActionEvent) => void,
  ): Promise<void> {
    const bot = new SpyBot(gameEngine, difficulty, botUserId)
    const decision = bot.decide()
    if (!decision) return

    const move = bot.decisionToMove(decision)
    const botName = gameEngine.getPlayers().find((p) => p.id === botUserId)?.name ?? 'Bot'

    onBotAction?.({
      type: EVENT_TYPE_BY_MOVE[move.type] ?? 'thinking',
      botName,
      message: `${botName} ${SpyBotExecutor.describe(move)}`,
    })
    await onMove(move)
  }

  /** True when this bot owes an action right now. */
  static hasPendingAction(gameEngine: SpyGame, botUserId: string, difficulty: BotDifficulty): boolean {
    return new SpyBot(gameEngine, difficulty, botUserId).decide() !== null
  }

  private static nextAction(
    gameEngine: SpyGame,
    bots: SpyBotParticipant[]
  ): { move: Move; botName: string } | null {
    for (const bot of bots) {
      const brain = new SpyBot(gameEngine, bot.difficulty, bot.userId)
      const decision = brain.decide()
      if (!decision) continue

      return {
        move: brain.decisionToMove(decision),
        botName: gameEngine.getPlayers().find((p) => p.id === bot.userId)?.name ?? 'Bot',
      }
    }
    return null
  }

  private static describe(move: Move): string {
    switch (move.type) {
      case 'player-ready':
        return 'is ready'
      case 'ask-question':
        return 'asked a question'
      case 'answer-question':
        return 'answered'
      case 'vote':
        return 'voted'
      default:
        return 'acted'
    }
  }
}
