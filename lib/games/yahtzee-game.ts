import { GameEngine, Player, Move, GameConfig } from '../game-engine'
import { YahtzeeCategory, YahtzeeScorecard, rollDice, calculateScore, calculateTotalScore, isGameFinished } from '../yahtzee'

export interface YahtzeeGameData {
  round: number
  dice: number[] // 5 dice values (1-6)
  held: boolean[] // which dice are held
  rollsLeft: number
  scores: YahtzeeScorecard[]
}

export class YahtzeeGame extends GameEngine {
  constructor(gameId: string, config: GameConfig = { maxPlayers: 4, minPlayers: 1 }) {
    super(gameId, 'yahtzee', config)
  }

  getInitialGameData(): YahtzeeGameData {
    return {
      round: 1,
      dice: rollDice(5),
      held: [false, false, false, false, false],
      rollsLeft: 3,
      scores: []
    }
  }

  validateMove(move: Move): boolean {
    const gameData = this.state.data as YahtzeeGameData

    switch (move.type) {
      case 'roll':
        return gameData.rollsLeft > 0 && this.state.status === 'playing'

      case 'hold':
        const { diceIndex } = move.data
        return diceIndex >= 0 && diceIndex < 5 && gameData.rollsLeft < 3

      case 'score':
        const { category } = move.data as { category: YahtzeeCategory }
        const playerIndex = this.state.players.findIndex(p => p.id === move.playerId)
        if (playerIndex === -1) return false

        const playerScorecard = gameData.scores[playerIndex] || {}
        return playerScorecard[category] === undefined

      default:
        return false
    }
  }

  processMove(move: Move): void {
    const gameData = this.state.data as YahtzeeGameData

    switch (move.type) {
      case 'roll':
        // Roll unheld dice
        gameData.dice = gameData.dice.map((die, index) =>
          gameData.held[index] ? die : Math.floor(Math.random() * 6) + 1
        )
        gameData.rollsLeft--
        break

      case 'hold':
        const { diceIndex } = move.data
        gameData.held[diceIndex] = !gameData.held[diceIndex]
        break

      case 'score':
        const { category } = move.data as { category: YahtzeeCategory }
        const playerIndex = this.state.players.findIndex(p => p.id === move.playerId)
        if (playerIndex === -1) return

        // Initialize scorecard if needed
        if (!gameData.scores[playerIndex]) {
          gameData.scores[playerIndex] = {}
        }

        // Calculate and set score
        const score = calculateScore(gameData.dice, category)
        gameData.scores[playerIndex][category] = score

        // Update player score
        this.state.players[playerIndex].score = calculateTotalScore(gameData.scores[playerIndex])

        // Reset for next turn
        gameData.dice = rollDice(5)
        gameData.held = [false, false, false, false, false]
        gameData.rollsLeft = 3
        gameData.round++
        break
    }
  }

  checkWinCondition(): Player | null {
    // Yahtzee is finished when all players have completed their scorecards
    for (let i = 0; i < this.state.players.length; i++) {
      const scorecard = (this.state.data as YahtzeeGameData).scores[i]
      if (scorecard && !isGameFinished(scorecard)) {
        return null // Game not finished
      }
    }

    // Find player with highest score
    let winner: Player | null = null
    let maxScore = -1

    this.state.players.forEach(player => {
      if ((player.score || 0) > maxScore) {
        maxScore = player.score || 0
        winner = player
      }
    })

    return winner
  }

  getGameRules(): string[] {
    return [
      'Roll 5 dice up to 3 times per turn',
      'Hold dice you want to keep between rolls',
      'Score in one of the 13 categories after each turn',
      'Upper section: score sum of dice showing that number',
      'Lower section: special combinations with fixed scores',
      'Bonus 35 points if upper section >= 63',
      'Game ends when all categories are filled',
      'Highest total score wins'
    ]
  }

  // Yahtzee-specific methods
  getDice(): number[] {
    return [...(this.state.data as YahtzeeGameData).dice]
  }

  getHeld(): boolean[] {
    return [...(this.state.data as YahtzeeGameData).held]
  }

  getRollsLeft(): number {
    return (this.state.data as YahtzeeGameData).rollsLeft
  }

  getRound(): number {
    return (this.state.data as YahtzeeGameData).round
  }

  getScorecard(playerId: string): YahtzeeScorecard | null {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) return null
    return (this.state.data as YahtzeeGameData).scores[playerIndex] || null
  }
}