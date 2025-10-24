# Guess the Spy - Game Specification

## 🎯 Game Overview

**Guess the Spy** is a social deduction game where players try to identify who among them is the spy. All regular players know the location, but the spy doesn't. Through clever questioning and observation, players must find the spy while the spy tries to blend in.

## 👥 Players
- **Minimum**: 3 players
- **Maximum**: 10 players
- **Optimal**: 5-8 players

## 🎮 Game Roles

### Regular Players (Majority)
- **Know**: The secret location
- **Goal**: Find the spy through questions and voting
- **Win Condition**: Correctly identify the spy

### The Spy (1 player)
- **Knows**: Nothing about the location
- **Goal**: Blend in and guess the location
- **Win Condition**: Either avoid detection OR correctly guess the location

## 📋 Game Flow

### 1. Lobby Phase
- Players join the lobby with a code
- Host can configure:
  - Game duration (5-15 minutes)
  - Number of rounds
  - Location pool (preset or custom)
- Minimum 3 players to start

### 2. Role Assignment
- System randomly selects one player as the spy
- All other players see the location
- Spy sees "You are the SPY!" message

### 3. Discussion Phase (Main Game)
- **Timer**: 5-10 minutes
- **Turn Order**: Players take turns clockwise
- **On Your Turn**: Ask any player a question about the location
  - Example: "What do you usually do here?"
  - Example: "Is it crowded?"
- **Spy Strategy**: Answer vaguely to blend in
- **Player Strategy**: Ask questions that only someone who knows the location would understand

### 4. Voting Phase
- Players can call a vote at any time (or auto-trigger after timer)
- Each player votes for who they think is the spy
- Spy can make a final guess at the location before reveal

### 5. Reveal & Scoring
- **If Spy Gets Most Votes**:
  - Spy can make location guess
  - If correct: Spy wins (+2 points)
  - If wrong: Players win (+1 point each)
- **If Wrong Person Voted Out**:
  - Spy wins (+3 points)
- **If Timer Runs Out**:
  - Spy wins (+1 point)

## 🗺️ Location Categories

### Standard Pack (30 locations)
1. **Travel**: Airport, Train Station, Beach, Hotel, Cruise Ship
2. **Entertainment**: Casino, Movie Theater, Amusement Park, Concert Hall
3. **Daily Life**: Supermarket, Restaurant, School, Hospital, Bank
4. **Workplace**: Office, Factory, Construction Site, Police Station
5. **Recreation**: Gym, Park, Swimming Pool, Library
6. **Special**: Space Station, Submarine, Pirate Ship, Haunted House

### Future Expansions
- Holiday themed
- Fantasy locations
- Custom user-created packs

## 💻 Technical Implementation

### Database Schema

```typescript
// Extends existing Lobby/Game system
interface SpyGame {
  id: string
  lobbyId: string
  location: string
  spyPlayerId: string
  currentPlayerIndex: number
  timeLeft: number
  discussionStartTime: number
  votingPhase: boolean
  votes: Record<string, string> // playerId -> votedForId
  spyGuess: string | null
  status: 'waiting' | 'discussing' | 'voting' | 'finished'
  round: number
  maxRounds: number
  settings: SpyGameSettings
}

interface SpyGameSettings {
  gameDuration: number // in seconds
  allowSpyGuess: boolean
  locationPack: string
}

interface SpyPlayer {
  id: string
  userId: string
  username: string
  isSpy: boolean
  score: number
  hasVoted: boolean
  isReady: boolean
}
```

### Game State Management

```typescript
// lib/spy.ts

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

// Game logic functions
export function createSpyGame(players: string[]): SpyGameState
export function selectRandomLocation(): { location: string, category: string }
export function assignSpy(playerCount: number): number
export function processVotes(votes: Record<string, string>): { votedOutId: string, voteCount: number }
export function checkSpyGuess(guess: string, actualLocation: string): boolean
export function calculateScores(gameState: SpyGameState): Record<string, number>
```

### Socket.IO Events

```typescript
// Client -> Server
socket.emit('game-action', {
  lobbyCode: string,
  action: 'start-game' | 'ask-question' | 'call-vote' | 'vote' | 'spy-guess' | 'next-round',
  payload: any
})

// Server -> Clients
socket.on('game-update', {
  action: 'state-change' | 'player-joined' | 'player-left' | 'timer-update',
  payload: SpyGameState
})
```

## 🎨 UI Components

### Main Game Screen Layout

```
┌─────────────────────────────────────────┐
│  Timer: 5:23  |  Location: ?????        │ (Spy sees ?????)
│  Round: 1/3   |  Role: Regular Player   │ (or "SPY!")
├─────────────────────────────────────────┤
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │ Player │  │ Player │  │ Player │    │ Player Cards
│  │   1    │  │   2    │  │   3    │    │
│  └────────┘  └────────┘  └────────┘    │
│                                          │
├─────────────────────────────────────────┤
│  Current Turn: Player 2                  │
│                                          │
│  "What do you usually wear here?"       │ Questions/Chat Area
│                                          │
├─────────────────────────────────────────┤
│  [Ask Question] [Call Vote] [Chat 💬]  │ Action Buttons
└─────────────────────────────────────────┘
```

### Components to Create

1. **SpyGameBoard.tsx** - Main game container
2. **SpyPlayerCard.tsx** - Player display card
3. **SpyTimer.tsx** - Countdown timer
4. **SpyVotingPanel.tsx** - Voting interface
5. **SpyLocationReveal.tsx** - End game reveal animation
6. **SpyRoleCard.tsx** - Shows your role at game start

## 🎭 Game Phases UI

### 1. Waiting Lobby
```typescript
<div>
  <h2>Waiting for players...</h2>
  <PlayerList players={players} />
  <Button onClick={startGame}>Start Game (3/10)</Button>
</div>
```

### 2. Role Assignment (5 seconds)
```typescript
{isSpy ? (
  <div className="spy-reveal">
    <h1>🕵️ YOU ARE THE SPY!</h1>
    <p>Blend in and guess the location</p>
  </div>
) : (
  <div className="location-reveal">
    <h1>📍 {location}</h1>
    <p>Find the spy among you</p>
  </div>
)}
```

### 3. Discussion Phase
- Show all players in a circle
- Highlight current speaker
- Display timer
- Show location (or ????? for spy)
- Chat box for questions
- "Call Vote" button

### 4. Voting Phase
```typescript
<VotingPanel>
  {players.map(player => (
    <PlayerVoteButton
      player={player}
      onVote={handleVote}
      isSelected={vote === player.id}
    />
  ))}
</VotingPanel>
```

### 5. Reveal Phase
- Show who got voted
- If spy: Show spy guess attempt
- Display winner
- Show scores
- Next round button

## 🎵 Sound Effects (Reuse from existing)

```typescript
// lib/sounds.ts - Add new sounds
soundManager.play('spy-reveal')   // When spy role shown
soundManager.play('location-reveal') // When location shown
soundManager.play('vote-cast')    // When voting
soundManager.play('timer-warning') // Last 30 seconds
soundManager.play('spy-win')      // Spy wins
soundManager.play('players-win')  // Players win
```

## 🎨 Color Scheme

```css
/* Spy theme colors */
.spy-primary: #DC2626 (red)
.spy-secondary: #1F2937 (dark gray)
.spy-accent: #FBBF24 (gold)
.spy-bg: #111827 (very dark)

/* Role colors */
.regular-player: #3B82F6 (blue)
.spy-player: #DC2626 (red)
.voted-out: #6B7280 (gray)
```

## 📱 Responsive Design

- Desktop: Full layout with all players visible
- Tablet: Scrollable player list
- Mobile: Compact cards, stacked layout

## ✅ Acceptance Criteria

### MVP (Minimum Viable Product)
- [ ] Players can create/join spy game lobby
- [ ] Random role assignment (1 spy, rest regular)
- [ ] Display location to regular players only
- [ ] Timer for discussion phase
- [ ] Players can chat/ask questions
- [ ] Voting system
- [ ] Reveal and basic scoring
- [ ] Chat integration

### Nice to Have
- [ ] Multiple rounds
- [ ] Different location packs
- [ ] Spy location guess feature
- [ ] Player statistics
- [ ] Custom locations
- [ ] Voice chat integration
- [ ] Achievements

## 🧪 Testing Checklist

- [ ] 3 players minimum
- [ ] 10 players maximum
- [ ] Spy always assigned correctly
- [ ] Location hidden from spy
- [ ] Timer works correctly
- [ ] Voting: all players vote
- [ ] Voting: tie handling
- [ ] Scoring calculation
- [ ] Multiple rounds
- [ ] Socket.IO real-time updates
- [ ] Mobile responsive
- [ ] Dark mode support

## 📈 Future Enhancements

1. **Game Modes**
   - Quick Play (5 min)
   - Standard (10 min)
   - Extended (15 min)

2. **Custom Locations**
   - Players create location packs
   - Share with community
   - Vote on locations

3. **Advanced Features**
   - Voice chat
   - Replay system
   - Spectator mode
   - Ranked matchmaking

4. **Analytics**
   - Player stats
   - Win rates
   - Most played locations
   - Spy success rate

## 🚀 Getting Started

1. Read CONTRIBUTING.md
2. Create `/lib/spy.ts` with game logic
3. Create `/app/games/spy/page.tsx` for lobby
4. Create `/app/games/spy/[code]/page.tsx` for game
5. Test with multiple browser tabs
6. Have fun!

---

**Questions?** Check existing Yahtzee implementation or ask Denys!

Good luck building an awesome social deduction game! 🕵️‍♀️
