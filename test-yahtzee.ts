/**
 * Manual test script for Yahtzee game logic
 * Run with: npx tsx test-yahtzee.ts
 */

import { YahtzeeGame } from './lib/games/yahtzee-game'
import { Move, Player } from './lib/game-engine'

function log(message: string, data?: any) {
  console.log(`\n${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function testYahtzeeGame() {
  log('=== YAHTZEE GAME TEST ===')
  
  // Create game
  const game = new YahtzeeGame('test-game-1')
  
  // Add players
  const player1: Player = { id: 'player1', name: 'Alice', score: 0 }
  const player2: Player = { id: 'player2', name: 'Bob (Bot)', score: 0 }
  
  game.addPlayer(player1)
  game.addPlayer(player2)
  
  log('✓ Players added', game.getPlayers())
  
  // Start game
  const started = game.startGame()
  log(`✓ Game started: ${started}`)
  
  let state = game.getState()
  log('Initial state:', {
    status: state.status,
    currentPlayerIndex: state.currentPlayerIndex,
    currentPlayer: game.getCurrentPlayer()?.name,
    dice: game.getDice(),
    held: game.getHeld(),
    rollsLeft: game.getRollsLeft()
  })
  
  // TEST 1: First Roll
  log('\n--- TEST 1: First Roll ---')
  const rollMove1: Move = {
    playerId: 'player1',
    type: 'roll',
    data: {},
    timestamp: new Date()
  }
  
  const rollResult1 = game.makeMove(rollMove1)
  log(`Roll 1 result: ${rollResult1}`)
  
  state = game.getState()
  log('After roll 1:', {
    currentPlayer: game.getCurrentPlayer()?.name,
    currentPlayerIndex: state.currentPlayerIndex,
    dice: game.getDice(),
    rollsLeft: game.getRollsLeft(),
    held: game.getHeld()
  })
  
  // Verify turn didn't advance
  if (state.currentPlayerIndex !== 0) {
    log('❌ ERROR: Turn advanced after roll! Should still be player 0')
    return false
  }
  log('✓ Turn did NOT advance after roll')
  
  // Verify rollsLeft decreased
  if (game.getRollsLeft() !== 2) {
    log(`❌ ERROR: rollsLeft should be 2, but is ${game.getRollsLeft()}`)
    return false
  }
  log('✓ rollsLeft decreased to 2')
  
  // TEST 2: Hold some dice
  log('\n--- TEST 2: Hold Dice ---')
  const holdMove1: Move = {
    playerId: 'player1',
    type: 'hold',
    data: { diceIndex: 0 },
    timestamp: new Date()
  }
  
  const holdResult1 = game.makeMove(holdMove1)
  log(`Hold dice 0 result: ${holdResult1}`)
  
  state = game.getState()
  log('After hold:', {
    currentPlayer: game.getCurrentPlayer()?.name,
    currentPlayerIndex: state.currentPlayerIndex,
    held: game.getHeld(),
    rollsLeft: game.getRollsLeft()
  })
  
  // Verify turn didn't advance
  if (state.currentPlayerIndex !== 0) {
    log('❌ ERROR: Turn advanced after hold!')
    return false
  }
  log('✓ Turn did NOT advance after hold')
  
  // Verify dice is held
  if (!game.getHeld()[0]) {
    log('❌ ERROR: Dice 0 should be held!')
    return false
  }
  log('✓ Dice 0 is now held')
  
  // TEST 3: Second Roll
  log('\n--- TEST 3: Second Roll ---')
  const heldDice = game.getDice()[0] // Remember the held die value
  
  const rollMove2: Move = {
    playerId: 'player1',
    type: 'roll',
    data: {},
    timestamp: new Date()
  }
  
  const rollResult2 = game.makeMove(rollMove2)
  log(`Roll 2 result: ${rollResult2}`)
  
  state = game.getState()
  log('After roll 2:', {
    currentPlayer: game.getCurrentPlayer()?.name,
    currentPlayerIndex: state.currentPlayerIndex,
    dice: game.getDice(),
    rollsLeft: game.getRollsLeft(),
    held: game.getHeld()
  })
  
  // Verify held die didn't change
  if (game.getDice()[0] !== heldDice) {
    log(`❌ ERROR: Held die changed from ${heldDice} to ${game.getDice()[0]}!`)
    return false
  }
  log(`✓ Held die stayed at ${heldDice}`)
  
  // Verify rollsLeft decreased
  if (game.getRollsLeft() !== 1) {
    log(`❌ ERROR: rollsLeft should be 1, but is ${game.getRollsLeft()}`)
    return false
  }
  log('✓ rollsLeft decreased to 1')
  
  // TEST 4: Third Roll
  log('\n--- TEST 4: Third Roll ---')
  const rollMove3: Move = {
    playerId: 'player1',
    type: 'roll',
    data: {},
    timestamp: new Date()
  }
  
  const rollResult3 = game.makeMove(rollMove3)
  log(`Roll 3 result: ${rollResult3}`)
  
  state = game.getState()
  log('After roll 3:', {
    currentPlayer: game.getCurrentPlayer()?.name,
    currentPlayerIndex: state.currentPlayerIndex,
    dice: game.getDice(),
    rollsLeft: game.getRollsLeft()
  })
  
  // Verify rollsLeft is now 0
  if (game.getRollsLeft() !== 0) {
    log(`❌ ERROR: rollsLeft should be 0, but is ${game.getRollsLeft()}`)
    return false
  }
  log('✓ rollsLeft is now 0')
  
  // TEST 5: Try to roll again (should fail)
  log('\n--- TEST 5: Try 4th Roll (should fail) ---')
  const rollMove4: Move = {
    playerId: 'player1',
    type: 'roll',
    data: {},
    timestamp: new Date()
  }
  
  const rollResult4 = game.makeMove(rollMove4)
  log(`Roll 4 result: ${rollResult4} (should be false)`)
  
  if (rollResult4) {
    log('❌ ERROR: 4th roll should have been rejected!')
    return false
  }
  log('✓ 4th roll was correctly rejected')
  
  // TEST 6: Score
  log('\n--- TEST 6: Score in category ---')
  const scoreMove: Move = {
    playerId: 'player1',
    type: 'score',
    data: { category: 'ones' },
    timestamp: new Date()
  }
  
  const scoreResult = game.makeMove(scoreMove)
  log(`Score result: ${scoreResult}`)
  
  state = game.getState()
  const scorecard = game.getScorecard('player1')
  log('After scoring:', {
    currentPlayer: game.getCurrentPlayer()?.name,
    currentPlayerIndex: state.currentPlayerIndex,
    rollsLeft: game.getRollsLeft(),
    scorecard: scorecard
  })
  
  // Verify turn DID advance after scoring
  if (state.currentPlayerIndex !== 1) {
    log(`❌ ERROR: Turn should have advanced to player 1, but is at ${state.currentPlayerIndex}`)
    return false
  }
  log('✓ Turn advanced to player 1 (Bob)')
  
  // Verify rollsLeft reset to 3
  if (game.getRollsLeft() !== 3) {
    log(`❌ ERROR: rollsLeft should be 3 for new turn, but is ${game.getRollsLeft()}`)
    return false
  }
  log('✓ rollsLeft reset to 3')
  
  // Verify score was recorded
  if (scorecard && scorecard.ones === undefined) {
    log('❌ ERROR: Score for ones should be recorded!')
    return false
  }
  log(`✓ Score recorded: ones = ${scorecard?.ones}`)
  
  log('\n=== ALL TESTS PASSED ===')
  return true
}

// Run the test
testYahtzeeGame()
