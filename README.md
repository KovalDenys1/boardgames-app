# 🎮 BoardGames App# BoardGames - Multiplayer Board Games Platform



A real-time multiplayer board games platform built with Next.js, Socket.IO, and PostgreSQL. Currently features Yahtzee with support for multiple simultaneous games.A full-stack app for playing board games online with friends. First game: **Yahtzee**.



## ✨ Features## 🎯 Features



- 🎲 **Real-time Yahtzee** - Play with friends in real-time- ✅ User registration and authentication (JWT + bcrypt)

- 👥 **Multiplayer Lobbies** - Create or join game rooms with unique codes- ✅ Create lobbies with unique codes

- 🔐 **Authentication** - Secure login with email/password or OAuth (Google, GitHub)- ✅ Password-protected lobbies

- 🎯 **Live Game State** - Synchronized game state across all players- ✅ Share invite links with friends

- 🏆 **Score Tracking** - Automatic score calculation and winner determination- ✅ Real-time multiplayer with Socket.IO

- 📱 **Responsive Design** - Works on desktop and mobile devices- ✅ Full Yahtzee gameplay with scoring



## 🚀 Tech Stack## 🛠 Tech Stack



- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS

- **Backend**: Custom Node.js server with Next.js integration- **Backend**: Next.js API Routes, Socket.IO

- **Real-time**: Socket.IO for WebSocket communication- **Database**: PostgreSQL (Prisma ORM)

- **Database**: PostgreSQL with Prisma ORM- **Auth**: JWT + bcrypt (+ NextAuth for OAuth)

- **Auth**: NextAuth.js with JWT strategy- **Real-time**: Socket.IO

- **Deployment**: Render.com (or any Node.js hosting)

## � Quick Start

## 📋 Prerequisites

### 1. Clone and install

- Node.js 18+ 

- PostgreSQL database```bash

- npm or yarngit clone <your-repo-url>

cd boardgames-app

## 🛠️ Installationnpm install

```

1. **Clone the repository**

   ```bash### 2. Configure environment

   git clone https://github.com/yourusername/boardgames-app.git

   cd boardgames-appCopy `.env.example` to `.env.local` and fill in your values:

   ```

```bash

2. **Install dependencies**cp .env.example .env.local

   ```bash```

   npm install

   ```Required variables:

- `DATABASE_URL` - PostgreSQL connection string

3. **Set up environment variables**- `JWT_SECRET` - Random string (min 32 chars)

   - `NEXTAUTH_SECRET` - Random string (min 32 chars)

   Create a `.env` file in the root directory:- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)

   ```env

   # DatabaseOptional OAuth (see [docs/OAUTH.md](docs/OAUTH.md) for setup):

   DATABASE_URL="postgresql://user:password@localhost:5432/boardgames"- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

- `GITHUB_ID` / `GITHUB_SECRET`

   # Authentication (generate random 32-byte hex strings)

   JWT_SECRET="your-jwt-secret-here"### 3. Setup database

   NEXTAUTH_SECRET="your-nextauth-secret-here"

   NEXTAUTH_URL="http://localhost:3000"```bash

npm run db:push

   # Optional: OAuth providers```

   GOOGLE_CLIENT_ID="your-google-client-id"

   GOOGLE_CLIENT_SECRET="your-google-client-secret"### 4. Start development server

   GITHUB_ID="your-github-client-id"

   GITHUB_SECRET="your-github-client-secret"```bash

   ```npm run dev

```

   To generate secure secrets:

   ```bashApp will be available at `http://localhost:3000`

   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   ```## 🔐 OAuth Setup



4. **Set up the database**This app supports optional OAuth authentication via:

   ```bash- ✅ Google

   npx prisma db push- ✅ GitHub

   ```

For detailed OAuth setup instructions, see [docs/OAUTH.md](docs/OAUTH.md)

5. **Run the development server**

   ```bash## 🎮 How to play

   npm run dev

   ```1. **Register** at `/auth/register`

2. **Create a lobby** via "Create New Lobby" and set options

6. **Open your browser**3. **Invite friends** by sharing the lobby code or link

   4. **Play**: when everyone has joined, click "Start Yahtzee Game"

   Navigate to [http://localhost:3000](http://localhost:3000)5. **Yahtzee** basics:

   - Roll dice (3 rolls per turn)

## 🎮 How to Play   - Hold dice by clicking them

   - Choose a scoring category

1. **Register/Login** - Create an account or sign in   - Game ends when all categories are filled

2. **Create a Lobby** - Set up a new game room with a unique code

3. **Share the Code** - Invite friends with the lobby code## 📁 Project structure

4. **Start Playing** - Once everyone joins, start the game!

5. **Roll & Score** - Take turns rolling dice and marking scores```

boardgames-app/

## 🏗️ Project Structure├── app/                      # Next.js App Router

│   ├── api/                  # API Routes

```│   │   ├── auth/             # Register/Login

boardgames-app/│   │   └── lobby/            # Create/Join lobbies

├── app/                    # Next.js App Router│   ├── auth/                 # Auth pages

│   ├── api/               # API routes│   ├── lobby/                # Lobby and game pages

│   ├── auth/              # Authentication pages│   ├── globals.css           # Global styles

│   ├── lobby/             # Lobby pages│   ├── layout.tsx            # Root layout

│   ├── layout.tsx         # Root layout│   └── page.tsx              # Landing page

│   └── page.tsx           # Home page├── lib/                      # Utilities

├── lib/                   # Utility functions│   ├── auth.ts               # JWT/bcrypt helpers

│   ├── auth.ts           # Authentication helpers│   ├── db.ts                 # Prisma client

│   ├── db.ts             # Prisma client│   ├── lobby.ts              # Lobby code generation

│   ├── lobby.ts          # Lobby management│   └── yahtzee.ts            # Yahtzee game logic

│   └── yahtzee.ts        # Game logic├── prisma/

├── prisma/               # Database schema│   └── schema.prisma         # Database schema

│   └── schema.prisma     # Prisma schema├── server.ts                 # Custom server with Socket.IO

├── types/                # TypeScript types├── package.json

├── server.ts             # Custom server (Next.js + Socket.IO)└── .env.local                # Environment variables (not committed)

└── socket-server.ts      # Standalone Socket.IO server (optional)```

```

## 🎲 Yahtzee rules (short)

## 🚀 Deployment

- 5 dice, 3 rolls per turn

### Environment Variables- 13 categories to fill

- Bonus +35 if upper section total ≥63

Set these on your hosting platform:- Winner: highest final score



```env## 🔐 API Endpoints

DATABASE_URL=              # PostgreSQL connection string

JWT_SECRET=                # Random 32-byte hex string### Auth

NEXTAUTH_SECRET=           # Random 32-byte hex string- `POST /api/auth/register` - Register

NEXTAUTH_URL=              # Your production URL- `POST /api/auth/login` - Login

NODE_ENV=production        # Production mode

```### Lobby

- `GET /api/lobby` - List active lobbies

### Build Commands- `POST /api/lobby` - Create lobby

- `GET /api/lobby/[code]` - Lobby info

```bash- `POST /api/lobby/[code]` - Join lobby

npm install               # Install dependencies

npm run build            # Build Next.js app## 🚀 Deployment

npm start                # Start production server

```**Ready to deploy?** See **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** for step-by-step instructions!



### Deploy to Render.com### Quick Overview



1. Create new Web ServiceThis app is optimized for **Render.com** (free tier available):

2. Connect your GitHub repository- ✅ Custom Node.js server with Socket.IO support

3. Set build command: `npm install && npm run build`- ✅ Free PostgreSQL database (90 days)

4. Set start command: `npm start`- ✅ Automatic SSL certificates

5. Add environment variables- ✅ Simple GitHub integration

6. Deploy!

**Deployment time:** ~30 minutes

## 🎯 Roadmap

For detailed instructions, see:

- [ ] Add more games (Chess, Checkers, Uno)- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Quick start guide

- [ ] Player rankings and statistics- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete documentation

- [ ] In-game chat

- [ ] Spectator mode## �️ Roadmap

- [ ] Game replays

- [ ] Mobile appSee [ROADMAP.md](ROADMAP.md) for detailed development plans.



See [ROADMAP.md](ROADMAP.md) for detailed plans.Next features:

- [ ] More games (Chess, Uno, Checkers)

## 🤝 Contributing- [ ] Player rankings and stats

- [ ] Lobby chat

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.- [ ] Dice roll animations

- [ ] Mobile responsiveness improvements

## 📄 License- [ ] Dark/Light theme toggle



This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.## 🤝 Contributing



## 🙏 AcknowledgmentsContributions are welcome! Please feel free to submit a Pull Request.



- Built with [Next.js](https://nextjs.org/)1. Fork the project

- Real-time powered by [Socket.IO](https://socket.io/)2. Create your feature branch (`git checkout -b feature/AmazingFeature`)

- Styled with [Tailwind CSS](https://tailwindcss.com/)3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)

- Database with [Prisma](https://www.prisma.io/)4. Push to the branch (`git push origin feature/AmazingFeature`)

5. Open a Pull Request

## 📧 Contact

## 📄 License

For questions or support, please open an issue on GitHub.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Made with ❤️ and ☕

Built with ❤️ and GitHub Copilot

## 📚 Documentation

- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Production deployment quick start
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide
- **[docs/OAUTH.md](docs/OAUTH.md)** - Google & GitHub authentication setup
- **[ROADMAP.md](ROADMAP.md)** - Future features and improvements
