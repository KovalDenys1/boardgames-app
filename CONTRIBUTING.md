# Contributing to Boardly

## 👋 Welcome!

This project contains multiple board games. Each game is developed independently but shares common infrastructure.

## 🎮 Current Games

### ✅ Yahtzee (Complete)
- **Status**: Fully functional
- **Developer**: Denys
- **Location**: `/app/lobby/[code]/page.tsx`, `/lib/yahtzee.ts`
- **Features**: Multiplayer dice game, real-time updates, chat, sound effects

### 🚧 Guess the Spy (In Development)
- **Status**: Ready to start
- **Developer**: [Your girlfriend's name]
- **Location**: `/app/games/spy/`, `/lib/spy.ts`
- **Goal**: Social deduction game where players find the spy

## 🏗️ Project Structure

```
Boardly/
├── app/
│   ├── games/              # Games selection page
│   │   ├── page.tsx        # Main games menu
│   │   └── spy/            # Guess the Spy game (TO BE CREATED)
│   │       ├── page.tsx    # Spy game lobby selection
│   │       └── [code]/     # Spy game room
│   │           └── page.tsx
│   ├── lobby/              # Yahtzee lobby system
│   └── api/                # API routes
├── components/             # Shared UI components
│   ├── Chat.tsx           # ✅ Ready to use in any game
│   ├── PlayerList.tsx     # ✅ Can be reused
│   └── LoadingSpinner.tsx # ✅ Utility component
├── lib/
│   ├── yahtzee.ts         # Yahtzee game logic
│   ├── spy.ts             # TO CREATE: Spy game logic
│   ├── auth.ts            # ✅ Authentication
│   ├── db.ts              # ✅ Database connection
│   └── sounds.ts          # ✅ Sound manager
└── prisma/
    └── schema.prisma      # Database schema

```

## 🚀 Getting Started with "Guess the Spy"

### Step 1: Understand the Shared Infrastructure

**Already available for you:**
- ✅ User authentication (login/register)
- ✅ Real-time communication (Socket.IO)
- ✅ Chat system (components/Chat.tsx)
- ✅ Database (Prisma + PostgreSQL)
- ✅ Lobby system (can be reused or modified)
- ✅ Sound manager
- ✅ UI components (buttons, cards, animations)

### Step 2: Game Structure Template

Create these files in order:

1. **lib/spy.ts** - Game logic and types
2. **app/games/spy/page.tsx** - Lobby selection for Spy game
3. **app/games/spy/[code]/page.tsx** - Game room
4. **components/SpyGameBoard.tsx** - Main game UI
5. **API routes** (if needed) - `/app/api/spy/`

### Step 3: Development Workflow

```bash
# Start development server
npm run dev

# Your game will be at:
# http://localhost:3000/games/spy
```

## 📋 Guess the Spy - Game Design

### Game Concept
- **Players**: 3-10 people
- **Roles**: Most players get a location, one player is the spy (doesn't know location)
- **Goal**: 
  - Regular players: Find the spy
  - Spy: Blend in and guess the location

### Game Flow
1. Players join lobby
2. Game starts, roles assigned
3. Players take turns asking questions
4. Vote on who is the spy
5. Reveal and scoring

### Example Locations
- Airport, Beach, Casino, Hospital, Restaurant, School, etc.

## 🛠️ Code Examples

### Example: Creating Game State Type

```typescript
// lib/spy.ts
export interface SpyGameState {
  round: number
  currentPlayerIndex: number
  location: string
  spyIndex: number
  players: SpyPlayer[]
  timeLeft: number
  votes: { [playerId: string]: string }
  status: 'waiting' | 'playing' | 'voting' | 'finished'
}

export interface SpyPlayer {
  id: string
  name: string
  isSpy: boolean
  hasVoted: boolean
}
```

### Example: Using Chat Component

```typescript
import Chat from '@/components/Chat'

// In your component
const [chatMessages, setChatMessages] = useState([])
const [chatMinimized, setChatMinimized] = useState(false)

<Chat
  messages={chatMessages}
  onSendMessage={handleSendMessage}
  currentUserId={session?.user?.id}
  isMinimized={chatMinimized}
  onToggleMinimize={() => setChatMinimized(!chatMinimized)}
/>
```

### Example: Socket.IO Integration

```typescript
import { io } from 'socket.io-client'

// Connect to socket
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin)

// Join game room
socket.emit('join-lobby', lobbyCode)

// Listen for game updates
socket.on('game-update', (data) => {
  if (data.action === 'state-change') {
    setGameState(data.payload)
  }
})

// Send game action
socket.emit('game-action', {
  lobbyCode: code,
  action: 'vote',
  payload: { votedPlayerId: 'player123' }
})
```

## 🎨 UI Guidelines

### Colors (already defined in globals.css)
- Primary: Blue (#3B82F6)
- Success: Green (#22C55E)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

### Components to Use
- `btn btn-primary` - Primary button
- `btn btn-secondary` - Secondary button
- `card` - Card container
- Custom animations available in globals.css

## 📦 Database Integration

If you need database tables for Spy game:

```prisma
// prisma/schema.prisma

model SpyGame {
  id        String   @id @default(cuid())
  lobbyId   String
  lobby     Lobby    @relation(fields: [lobbyId], references: [id])
  state     String?  // JSON game state
  status    String   @default("waiting")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
npx prisma migrate dev --name add_spy_game
```

## 🤝 Collaboration Tips

### Working in Parallel
- **Denys works on**: Yahtzee improvements, bug fixes
- **You work on**: Guess the Spy implementation
- **Shared**: Both can improve shared components (Chat, UI)

### Git Workflow
```bash
# Create your branch for Spy game
git checkout -b feature/guess-the-spy

# Regular commits
git add .
git commit -m "Add spy game lobby"

# When ready, merge to main
git checkout main
git merge feature/guess-the-spy
```

### Avoid Conflicts
- Denys: Focuses on `/app/lobby/`, `/lib/yahtzee.ts`
- You: Focus on `/app/games/spy/`, `/lib/spy.ts`
- Shared files: Communicate before changing

## 📚 Useful Resources

### Project Dependencies
- Next.js 14 - https://nextjs.org/docs
- React - https://react.dev
- Socket.IO - https://socket.io/docs/v4
- Prisma - https://www.prisma.io/docs
- NextAuth - https://next-auth.js.org
- Tailwind CSS - https://tailwindcss.com/docs

### Game Logic References
Look at existing Yahtzee implementation:
- `/lib/yahtzee.ts` - Game logic structure
- `/app/lobby/[code]/page.tsx` - How game state is managed
- `/components/` - Reusable UI patterns

## 🐛 Debugging

```bash
# Check console logs
# In browser: F12 -> Console

# Server logs
# In terminal where npm run dev is running

# Database
npx prisma studio
```

## ✅ Checklist for New Game

- [ ] Create game logic in `/lib/spy.ts`
- [ ] Define TypeScript types for game state
- [ ] Create lobby page `/app/games/spy/page.tsx`
- [ ] Create game room `/app/games/spy/[code]/page.tsx`
- [ ] Add Socket.IO event handlers
- [ ] Create UI components
- [ ] Add sound effects (optional)
- [ ] Test with multiple players
- [ ] Update game status in `/app/games/page.tsx`

## 💡 Tips

1. **Start Small**: Get basic lobby working first
2. **Reuse Code**: Look at Yahtzee for patterns
3. **Test Often**: Use multiple browser tabs to test multiplayer
4. **Ask for Help**: Check existing code or ask Denys
5. **Have Fun**: This is a game, make it enjoyable!

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# http://localhost:3000

# Database GUI
npx prisma studio

# Create database migration
npx prisma migrate dev

# Format code
npm run format
```

Good luck! 🚀 Feel free to modify any shared components or create new ones!
