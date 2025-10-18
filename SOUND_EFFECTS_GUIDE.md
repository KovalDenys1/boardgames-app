# Sound Effects Guide

## 🔊 Complete Sound System

### Sound Events

#### For Active Player (You):
1. **🎲 Dice Roll** - When you click "Roll Dice"
   - File: `dice-roll.mp3`
   - Triggers: `handleRollDice()`

2. **🔘 Click** - Interactive feedback
   - File: `click.mp3`
   - Triggers:
     - Starting a game
     - Holding/unholding dice
     - Your turn starts (300ms delay after turn change sound)

3. **🎯 Score** - When you select a category
   - File: `score.mp3`
   - Triggers: `handleScoreSelection()`

4. **🎊 Celebrate** - Confetti for good scores
   - Triggers: When your score ≥ 20 points
   - Effect: Burst of confetti

5. **🎆 Fireworks** - Game completion celebration
   - Triggers: When game finishes
   - Effect: 3-second fireworks animation

#### For Other Players (Spectators):
1. **🎲 Dice Roll** - Hear when another player rolls
   - File: `dice-roll.mp3`
   - Triggers: Via WebSocket when `rollsLeft` decreases
   - Purpose: Stay engaged with the game flow

2. **🔄 Turn Change** - Hear when turn switches
   - File: `turn-change.mp3`
   - Triggers: Via WebSocket when `currentPlayerIndex` changes
   - Purpose: Know when someone's turn ends

3. **🔘 Click** - Alert when it becomes YOUR turn
   - File: `click.mp3`
   - Triggers: 300ms after turn change sound (if it's now your turn)
   - Purpose: "Wake up" notification

4. **🎯 Score** - Hear when someone selects a score
   - File: `score.mp3`
   - Triggers: Via WebSocket when `round` increases
   - Purpose: Track game progress

5. **🏆 Win + Fireworks** - Everyone celebrates together
   - File: `win.mp3`
   - Triggers: Via WebSocket when `finished` becomes true
   - Effect: All players see fireworks simultaneously

### Sound Detection Logic

```typescript
// In WebSocket game-update handler:
if (gameState) {
  // 1. Dice rolled?
  if (updatedState.rollsLeft < gameState.rollsLeft) {
    soundManager.play('diceRoll')
  }
  
  // 2. Turn changed?
  if (updatedState.currentPlayerIndex !== gameState.currentPlayerIndex) {
    soundManager.play('turnChange')
    
    // Is it MY turn now?
    if (myIndex === updatedState.currentPlayerIndex) {
      setTimeout(() => {
        soundManager.play('click') // "Your turn!" alert
      }, 300)
    }
  }
  
  // 3. Someone scored?
  if (updatedState.round > gameState.round) {
    soundManager.play('score')
  }
  
  // 4. Game finished?
  if (!gameState.finished && updatedState.finished) {
    soundManager.play('win')
    setTimeout(() => {
      fireworks() // Everyone celebrates!
    }, 200)
  }
}
```

### User Experience Benefits

#### Engagement
- **Before**: Other players had to watch silently
- **After**: Hear all game actions in real-time

#### Turn Awareness
- **Before**: Easy to miss when it's your turn
- **After**: Clear audio cue (click) when your turn starts

#### Game Flow
- **Before**: Only active player heard sounds
- **After**: All players experience the same audio atmosphere

#### Immersion
- **Before**: Felt like watching, not playing
- **After**: Feels like sitting at the same table

### Sound Timing

All sounds are carefully timed to avoid overlap:

1. **Dice Roll** → Immediate
2. **Turn Change** → Immediate when turn switches
3. **Click (Your Turn)** → 300ms delay (after turn change)
4. **Score** → Immediate when round increases
5. **Win** → Immediate when game finishes
6. **Fireworks** → 200ms delay (after win sound)

### Muting

Players can toggle sound on/off:
- Button in lobby header: 🔊/🔇
- Preference saved in localStorage
- Respects user choice across sessions

### Technical Implementation

#### Server → Client Flow:
```
Player 1 rolls dice
    ↓
Server broadcasts via WebSocket
    ↓
Player 2, 3, 4 receive update
    ↓
Compare old vs new state
    ↓
Detect: rollsLeft decreased
    ↓
Play: dice-roll.mp3
```

#### Benefits of This Approach:
- ✅ Real-time synchronization
- ✅ All players hear events as they happen
- ✅ No polling or delays
- ✅ Efficient (only plays sound when state actually changes)
- ✅ Works across devices (phone, tablet, desktop)

### Accessibility

- Sound is optional (can be muted)
- Visual feedback still provided (animations, colors)
- Toast notifications for important events
- Works without sound for deaf/hard-of-hearing users

### Performance

- Sounds preloaded on page load
- No network delay during gameplay
- Lightweight files (< 100KB each)
- Efficient change detection (only compares relevant fields)

### Future Enhancements

Potential additions:
- [ ] Volume slider (currently just on/off)
- [ ] Different sounds for different score ranges
- [ ] "Yahtzee!" special sound when someone gets 50 points
- [ ] Countdown tick sound for last 10 seconds
- [ ] Achievement sounds (full house, straight, etc.)
- [ ] Customizable sound packs/themes
