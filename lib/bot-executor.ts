import { YahtzeeBot } from './yahtzee-bot'
import { YahtzeeGame } from './games/yahtzee-game'
import { Move } from './game-engine'
import { YahtzeeCategory } from './yahtzee'

/**
 * Bot move executor for Yahtzee game
 * Handles automatic bot decision-making and move execution
 */

export class BotMoveExecutor {
  /**
   * Execute a bot's turn with realistic delays
   * Returns a promise that resolves when the bot has completed its turn
   */
  static async executeBotTurn(
    gameEngine: YahtzeeGame,
    botUserId: string,
    onMove: (move: Move) => Promise<void>
  ): Promise<void> {
    console.log(`🤖 Bot ${botUserId} starting turn...`)

    const gameState = gameEngine.getState()
    const botPlayer = gameEngine.getPlayers().find(p => p.id === botUserId)

    if (!botPlayer) {
      console.error('Bot player not found in game')
      return
    }

    // Get bot's scorecard
    const botScorecard = gameEngine.getScorecard(botUserId) || {}

    // Initial roll (always roll first)
    await this.delay(1000) // Think for 1 second
    const rollMove: Move = {
      playerId: botUserId,
      type: 'roll',
      data: {},
      timestamp: new Date(),
    }
    await onMove(rollMove)
    console.log('🤖 Bot rolled dice (roll 1)')

    // Get updated state after roll
    let currentDice = gameEngine.getDice()
    let currentHeld = gameEngine.getHeld()
    let rollsLeft = gameEngine.getRollsLeft()

    // Roll up to 2 more times if needed
    for (let rollNum = 2; rollNum <= 3 && rollsLeft > 0; rollNum++) {
      // Decide whether to roll again or score now
      if (this.shouldStopRolling(currentDice, botScorecard)) {
        console.log('🤖 Bot decided to stop rolling and score')
        break
      }

      // Decide which dice to hold
      await this.delay(800) // Think time
      const diceToHold = YahtzeeBot.decideDiceToHold(
        currentDice,
        currentHeld,
        rollsLeft,
        botScorecard
      )

      console.log(`🤖 Bot holding dice at indices: ${diceToHold}`)

      // Apply holds
      for (let i = 0; i < currentHeld.length; i++) {
        const shouldHold = diceToHold.includes(i)
        if (currentHeld[i] !== shouldHold) {
          const holdMove: Move = {
            playerId: botUserId,
            type: 'hold',
            data: { diceIndex: i },
            timestamp: new Date(),
          }
          await onMove(holdMove)
        }
      }

      // Roll again
      await this.delay(1000)
      const nextRollMove: Move = {
        playerId: botUserId,
        type: 'roll',
        data: {},
        timestamp: new Date(),
      }
      await onMove(nextRollMove)
      console.log(`🤖 Bot rolled dice (roll ${rollNum})`)

      // Update state
      currentDice = gameEngine.getDice()
      currentHeld = gameEngine.getHeld()
      rollsLeft = gameEngine.getRollsLeft()
    }

    // Select category to score
    await this.delay(1200) // Final decision time
    const category = YahtzeeBot.selectCategory(currentDice, botScorecard)
    console.log(`🤖 Bot selected category: ${category}`)

    const scoreMove: Move = {
      playerId: botUserId,
      type: 'score',
      data: { category },
      timestamp: new Date(),
    }
    await onMove(scoreMove)
    console.log('🤖 Bot completed turn')
  }

  /**
   * Check if bot should stop rolling based on current dice
   */
  private static shouldStopRolling(dice: number[], scorecard: any): boolean {
    // Count dice values
    const counts = new Map<number, number>()
    dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1))

    // Stop if we have Yahtzee (5 of a kind)
    if (Array.from(counts.values()).some(c => c === 5)) {
      return true
    }

    // Stop if we have large straight (5 consecutive)
    const sortedUnique = Array.from(counts.keys()).sort((a, b) => a - b)
    if (this.hasConsecutive(sortedUnique, 5)) {
      return true
    }

    // Stop if we have full house (3 + 2)
    const countValues = Array.from(counts.values()).sort((a, b) => b - a)
    if (countValues.length === 2 && countValues[0] === 3 && countValues[1] === 2) {
      return true
    }

    // Stop if we have 4 of a kind with high sum
    if (Array.from(counts.values()).some(c => c === 4)) {
      const sum = dice.reduce((a, b) => a + b, 0)
      if (sum >= 24) return true
    }

    return false
  }

  /**
   * Check for consecutive numbers
   */
  private static hasConsecutive(values: number[], length: number): boolean {
    if (values.length < length) return false

    for (let i = 0; i <= values.length - length; i++) {
      let consecutive = true
      for (let j = 1; j < length; j++) {
        if (values[i + j] !== values[i] + j) {
          consecutive = false
          break
        }
      }
      if (consecutive) return true
    }
    return false
  }

  /**
   * Delay helper for realistic bot behavior
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if a player is a bot
   */
  static isBot(player: any): boolean {
    return player?.user?.isBot === true
  }
}
