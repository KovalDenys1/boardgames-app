# 🎮 BoardGames - Multiplayer Platform

A real-time multiplayer board games platform built with Next.js, Socket.IO, and PostgreSQL. Currently features Yahtzee with support for multiple simultaneous games.

## ✨ Features

- 🎲 **Real-time Yahtzee** - Play with friends in real-time
- 👥 **Multiplayer Lobbies** - Create or join game rooms with unique codes
- 🔐 **Authentication** - Secure login with email/password or OAuth (Google, GitHub)
- 🎯 **Live Game State** - Synchronized game state across all players
- ⏱️ **Turn Timer** - 60-second timer per turn with visual warnings
- 🏆 **Score Tracking** - Automatic score calculation and winner determination
- 🔗 **Invite Links** - Share lobby links with friends
- 👤 **User Profiles** - Customizable username and profile settings
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Custom Node.js server
- **Real-time**: Socket.IO for WebSocket communication
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with JWT strategy
- **Deployment**: Render.com

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/KovalDenys1/boardgames-app.git
cd boardgames-app
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random string (min 32 chars)
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)

Optional OAuth:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Setup Database

```bash
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

App will be available at `http://localhost:3000`

## 🎮 How to Play

1. **Register** at `/auth/register`
2. **Create a Lobby** - Set name, password (optional), max players
3. **Invite Friends** - Share the lobby code or copy the invite link
4. **Start Game** - Owner starts when 2+ players are ready
5. **Play Yahtzee**:
   - Roll dice (3 rolls per turn)
   - Click dice to hold/unhold them
   - Choose a scoring category
   - 60 seconds per turn
   - Game ends when all categories are filled

## 🔐 OAuth Setup

This app supports optional OAuth authentication:

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

**GitHub OAuth Setup:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

## 📁 Project Structure

```
boardgames-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── lobby/            # Lobby management
│   │   ├── game/             # Game state management
│   │   └── user/             # User profile
│   ├── auth/                 # Auth pages (login, register)
│   ├── lobby/                # Lobby and game pages
│   ├── profile/              # User profile page
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── Dice.tsx              # Dice component
│   ├── DiceGroup.tsx         # Dice group with roll logic
│   ├── Scorecard.tsx         # Yahtzee scorecard
│   ├── PlayerList.tsx        # Player list with scores
│   └── Header.tsx            # App header
├── lib/                      # Utility functions
│   ├── auth.ts               # Authentication helpers
│   ├── db.ts                 # Prisma client
│   ├── game.ts               # Game state management
│   ├── lobby.ts              # Lobby utilities
│   ├── yahtzee.ts            # Yahtzee game logic
│   └── next-auth.ts          # NextAuth configuration
├── prisma/
│   └── schema.prisma         # Database schema
├── server.ts                 # Custom server (Next.js + Socket.IO)
├── socket-server.ts          # Socket.IO server
└── package.json
```

## 🚀 Deployment

### Deploy to Render.com

1. Create new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables (see `.env.example`)
6. Deploy!

**Important**: Set `DATABASE_URL` to your PostgreSQL connection string on Render.

## 📚 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Lobby
- `GET /api/lobby` - List active lobbies
- `POST /api/lobby` - Create new lobby
- `GET /api/lobby/[code]` - Get lobby details
- `POST /api/lobby/[code]` - Join lobby
- `POST /api/lobby/[code]/leave` - Leave lobby
- `POST /api/lobby/cleanup` - Cleanup inactive lobbies

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update username

### Game
- `GET /api/game/[gameId]/state` - Get game state

## 🎯 Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans.

**Next Features:**
- [ ] More games (Chess, Uno, Checkers)
- [ ] Player rankings and statistics
- [ ] In-game chat
- [ ] Spectator mode
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Denys Koval**

Built with ❤️ and GitHub Copilot

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Socket.IO](https://socket.io/) - Real-time engine
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication

---

⭐ Star this repo if you find it useful!
