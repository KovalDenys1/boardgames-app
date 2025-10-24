// Guess the Spy - Game Logic
// This file contains all the game logic for the Spy game

export interface SpyPlayer {
  id: string
  userId: string
  username: string
  isSpy: boolean
  score: number
  hasVoted: boolean
  isReady: boolean
}

export interface SpyGameState {
  // Players
  players: SpyPlayer[]
  currentPlayerIndex: number
  spyIndex: number
  
  // Game info
  location: string
  locationCategory: string
  round: number
  maxRounds: number
  
  // Timing
  timeLeft: number
  totalTime: number
  
  // Phase
  phase: 'waiting' | 'discussing' | 'voting' | 'reveal' | 'finished'
  
  // Voting
  votes: Record<string, string>
  votingActive: boolean
  votingInitiatedBy: string | null
  
  // Spy guess
  spyGuess: string | null
  
  // Results
  winner: 'players' | 'spy' | null
  finished: boolean
}

export interface SpyGameSettings {
  gameDuration: number // in seconds (default: 600 = 10 minutes)
  allowSpyGuess: boolean
  locationPack: string
  maxRounds: number
}

// Location pools
export const LOCATION_PACKS = {
  standard: [
    // Travel
    { name: 'Airport', category: 'Travel', emoji: '✈️' },
    { name: 'Train Station', category: 'Travel', emoji: '🚂' },
    { name: 'Beach', category: 'Travel', emoji: '🏖️' },
    { name: 'Hotel', category: 'Travel', emoji: '🏨' },
    { name: 'Cruise Ship', category: 'Travel', emoji: '🚢' },
    
    // Entertainment
    { name: 'Casino', category: 'Entertainment', emoji: '🎰' },
    { name: 'Movie Theater', category: 'Entertainment', emoji: '🎬' },
    { name: 'Amusement Park', category: 'Entertainment', emoji: '🎢' },
    { name: 'Concert Hall', category: 'Entertainment', emoji: '🎵' },
    { name: 'Nightclub', category: 'Entertainment', emoji: '🍸' },
    
    // Daily Life
    { name: 'Supermarket', category: 'Daily Life', emoji: '🛒' },
    { name: 'Restaurant', category: 'Daily Life', emoji: '🍽️' },
    { name: 'School', category: 'Daily Life', emoji: '🏫' },
    { name: 'Hospital', category: 'Daily Life', emoji: '🏥' },
    { name: 'Bank', category: 'Daily Life', emoji: '🏦' },
    
    // Workplace
    { name: 'Office', category: 'Workplace', emoji: '💼' },
    { name: 'Factory', category: 'Workplace', emoji: '🏭' },
    { name: 'Construction Site', category: 'Workplace', emoji: '🏗️' },
    { name: 'Police Station', category: 'Workplace', emoji: '👮' },
    { name: 'Fire Station', category: 'Workplace', emoji: '🚒' },
    
    // Recreation
    { name: 'Gym', category: 'Recreation', emoji: '💪' },
    { name: 'Park', category: 'Recreation', emoji: '🌳' },
    { name: 'Swimming Pool', category: 'Recreation', emoji: '🏊' },
    { name: 'Library', category: 'Recreation', emoji: '📚' },
    { name: 'Museum', category: 'Recreation', emoji: '🏛️' },
    
    // Special
    { name: 'Space Station', category: 'Special', emoji: '🚀' },
    { name: 'Submarine', category: 'Special', emoji: '🚤' },
    { name: 'Pirate Ship', category: 'Special', emoji: '🏴‍☠️' },
    { name: 'Haunted House', category: 'Special', emoji: '👻' },
    { name: 'Zoo', category: 'Special', emoji: '🦁' },
  ]
}

/**
 * Select a random location from the specified pack
 */
export function selectRandomLocation(pack: string = 'standard'): { location: string, category: string, emoji: string } {
  const locations = LOCATION_PACKS[pack as keyof typeof LOCATION_PACKS] || LOCATION_PACKS.standard
  const randomIndex = Math.floor(Math.random() * locations.length)
  const selected = locations[randomIndex]
  return {
    location: selected.name,
    category: selected.category,
    emoji: selected.emoji
  }
}

/**
 * Randomly assign one player as the spy
 */
export function assignSpy(playerCount: number): number {
  return Math.floor(Math.random() * playerCount)
}

/**
 * Create initial game state
 */
export function createSpyGame(
  players: { id: string, userId: string, username: string }[],
  settings: SpyGameSettings = {
    gameDuration: 600,
    allowSpyGuess: true,
    locationPack: 'standard',
    maxRounds: 3
  }
): SpyGameState {
  const spyIndex = assignSpy(players.length)
  const locationData = selectRandomLocation(settings.locationPack)
  
  return {
    players: players.map((p, index) => ({
      ...p,
      isSpy: index === spyIndex,
      score: 0,
      hasVoted: false,
      isReady: true
    })),
    currentPlayerIndex: 0,
    spyIndex,
    location: locationData.location,
    locationCategory: locationData.category,
    round: 1,
    maxRounds: settings.maxRounds,
    timeLeft: settings.gameDuration,
    totalTime: settings.gameDuration,
    phase: 'discussing',
    votes: {},
    votingActive: false,
    votingInitiatedBy: null,
    spyGuess: null,
    winner: null,
    finished: false
  }
}

/**
 * Process votes and determine who got voted out
 */
export function processVotes(votes: Record<string, string>): { votedOutId: string, voteCount: number, voteCounts: Record<string, number> } {
  const voteCounts: Record<string, number> = {}
  
  // Count votes
  Object.values(votes).forEach(votedForId => {
    voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1
  })
  
  // Find player with most votes
  let maxVotes = 0
  let votedOutId = ''
  
  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      votedOutId = playerId
    }
  })
  
  return {
    votedOutId,
    voteCount: maxVotes,
    voteCounts
  }
}

/**
 * Check if spy's location guess is correct
 * Allows for slight misspellings or partial matches
 */
export function checkSpyGuess(guess: string, actualLocation: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim()
  const normalizedLocation = actualLocation.toLowerCase().trim()
  
  // Exact match
  if (normalizedGuess === normalizedLocation) {
    return true
  }
  
  // Partial match (at least 70% of the words match)
  const guessWords = normalizedGuess.split(' ')
  const locationWords = normalizedLocation.split(' ')
  
  let matchCount = 0
  guessWords.forEach(word => {
    if (locationWords.some(locWord => locWord.includes(word) || word.includes(locWord))) {
      matchCount++
    }
  })
  
  return matchCount / Math.max(guessWords.length, locationWords.length) >= 0.7
}

/**
 * Calculate final scores for all players
 */
export function calculateScores(gameState: SpyGameState): Record<string, number> {
  const scores: Record<string, number> = {}
  const voteResult = processVotes(gameState.votes)
  const votedOutPlayer = gameState.players.find(p => p.id === voteResult.votedOutId)
  
  gameState.players.forEach(player => {
    scores[player.id] = player.score
  })
  
  // Spy was voted out
  if (votedOutPlayer?.isSpy) {
    // Check if spy guessed location
    if (gameState.spyGuess && checkSpyGuess(gameState.spyGuess, gameState.location)) {
      // Spy wins by guessing location
      scores[votedOutPlayer.id] += 2
    } else {
      // Players win
      gameState.players.forEach(player => {
        if (!player.isSpy) {
          scores[player.id] += 1
        }
      })
    }
  } else {
    // Wrong person voted out or no one voted - Spy wins
    const spy = gameState.players[gameState.spyIndex]
    scores[spy.id] += 3
  }
  
  return scores
}

/**
 * Move to next player's turn
 */
export function nextPlayerTurn(gameState: SpyGameState): number {
  return (gameState.currentPlayerIndex + 1) % gameState.players.length
}

/**
 * Check if all players have voted
 */
export function allPlayersVoted(gameState: SpyGameState): boolean {
  return Object.keys(gameState.votes).length === gameState.players.length
}

/**
 * Start voting phase
 */
export function startVoting(gameState: SpyGameState, initiatorId: string): SpyGameState {
  return {
    ...gameState,
    phase: 'voting',
    votingActive: true,
    votingInitiatedBy: initiatorId,
    votes: {}
  }
}

/**
 * End game and calculate winners
 */
export function endGame(gameState: SpyGameState): SpyGameState {
  const finalScores = calculateScores(gameState)
  const voteResult = processVotes(gameState.votes)
  const votedOutPlayer = gameState.players.find(p => p.id === voteResult.votedOutId)
  
  let winner: 'players' | 'spy' = 'players'
  
  if (votedOutPlayer?.isSpy) {
    if (gameState.spyGuess && checkSpyGuess(gameState.spyGuess, gameState.location)) {
      winner = 'spy'
    }
  } else {
    winner = 'spy'
  }
  
  return {
    ...gameState,
    phase: 'finished',
    finished: true,
    winner,
    players: gameState.players.map(p => ({
      ...p,
      score: finalScores[p.id]
    }))
  }
}

/**
 * Start next round
 */
export function nextRound(gameState: SpyGameState, settings: SpyGameSettings): SpyGameState {
  if (gameState.round >= gameState.maxRounds) {
    return endGame(gameState)
  }
  
  const spyIndex = assignSpy(gameState.players.length)
  const locationData = selectRandomLocation(settings.locationPack)
  
  return {
    ...gameState,
    round: gameState.round + 1,
    spyIndex,
    location: locationData.location,
    locationCategory: locationData.category,
    currentPlayerIndex: 0,
    timeLeft: settings.gameDuration,
    phase: 'discussing',
    votes: {},
    votingActive: false,
    votingInitiatedBy: null,
    spyGuess: null,
    players: gameState.players.map((p, index) => ({
      ...p,
      isSpy: index === spyIndex,
      hasVoted: false
    }))
  }
}

/**
 * Get player by ID
 */
export function getPlayerById(gameState: SpyGameState, playerId: string): SpyPlayer | undefined {
  return gameState.players.find(p => p.id === playerId)
}

/**
 * Check if player is the spy
 */
export function isPlayerSpy(gameState: SpyGameState, playerId: string): boolean {
  const player = getPlayerById(gameState, playerId)
  return player?.isSpy || false
}

/**
 * Get current player
 */
export function getCurrentPlayer(gameState: SpyGameState): SpyPlayer {
  return gameState.players[gameState.currentPlayerIndex]
}

/**
 * Format time remaining as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
