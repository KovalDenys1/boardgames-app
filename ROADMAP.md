# 🎮 Boardgames App - Development Roadmap

## ✅ Done (MVP - Minimum Viable Product)

### Infrastructure
- [x] Next.js 14 (App Router) configured
- [x] PostgreSQL database on Render
- [x] Prisma ORM with models User, Account, Session, Lobby, Game, Player
- [x] WebSocket server (Socket.IO) for real-time interactions
- [x] TypeScript configuration
- [x] Tailwind CSS for styling

### Authentication
- [x] NextAuth.js integration
- [x] Credential-based login (email + password)
- [x] OAuth providers configured (Google, GitHub) - require credentials
- [x] JWT tokens for API
- [x] Protected API routes

### Core functionality
- [x] User registration and login
- [x] Create lobbies with settings (name, password, max players)
- [x] List active lobbies
- [x] Join a lobby
- [x] Yahtzee game engine (dice rolls, scoring)
- [x] Basic game UI

---

## 🚀 Next development steps

### Phase 1: Finalize OAuth and testing (1-2 days)

#### Critical tasks
- [ ] **Obtain OAuth credentials**
  - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
  - Create a GitHub OAuth App in [Developer Settings](https://github.com/settings/developers)
  - Add credentials to `.env.local`
  - Set callback URLs: `http://localhost:3000/api/auth/callback/google` and `/github`

- [ ] **Test all authentication methods**
  - Registration via email/password
  - Login via Google
  - Login via GitHub
  - Verify Account records created in DB

- [ ] **Improve error handling**
  - Show clear user-facing messages
  - Log server-side errors
  - Add form validation (Zod schemas)

---

### Phase 2: Yahtzee gameplay improvements (3-5 days)

#### UI/UX improvements
- [ ] **Gameplay animations**
  - Dice roll animations (CSS or Framer Motion)
  - Smooth transitions between rounds
  - Visual feedback on selecting/holding dice

- [ ] **Improved scorecard**
  - Color coding for possible scores
  - Highlight best choices
  - Round history
  - Game progress bar

- [ ] **Turns and timers system**
  - Per-turn timer (optional)
  - "Your turn" notification
  - Auto-skip on AFK

#### Multiplayer features
- [ ] **Real-time sync**
  - Sync game state via Socket.IO
  - Show active player
  - Notify on others' actions
  - Reconnection logic on disconnect

- [ ] **Lobby features**
  - Lobby chat
  - Ready check
  - Kick players (host only)
  - Game settings (round count, rule variants)

---

### Phase 3: Additional games (1-2 weeks)

#### Priority games to add
- [ ] **Uno**
  - Card and deck models
  - Game logic (turn chain, special cards)
  - Card UI with animations

- [ ] **Checkers**
  - 8x8 board
  - Move and capture logic
  - Move validation
  - King promotion

- [ ] **Chess**
  - Full rules implementation
  - Move validation
  - Check/mate logic
  - Integrate chess.js

#### Architecture for multiple games
- [ ] **Abstract game engine**
  ```typescript
  interface GameEngine {
    validateMove(state: GameState, move: Move): boolean
    applyMove(state: GameState, move: Move): GameState
    checkWinner(state: GameState): Player | null
    serializeState(state: GameState): string
  }
  ```

- [ ] **Game selection in lobby**
  - Dropdown with available games
  - Dynamic loading of game components
  - Tailored UI for each game

---

### Phase 4: Social features (1 week)

- [ ] **User profile**
  - Avatar (image upload)
  - Game stats (wins, losses, games)
  - Level and rating
  - Game history

- [ ] **Friends system**
  - Add friends
  - Private lobby invites
  - Notifications

- [ ] **Achievements**
  - First win
  - 10 games played
  - Game-specific (e.g., "Yahtzee!" in the first round)
  - Display on profile

- [ ] **Leaderboard**
  - Top players by rating
  - Filter by game
  - Weekly/monthly reset

---

### Phase 5: Production readiness (1-2 weeks)

#### Security
- [ ] Rate limiting (express-rate-limit or Upstash)
- [ ] CORS configuration
- [ ] Helmet.js for security headers
- [ ] Sanitize user input
- [ ] SQL injection protection (Prisma already protects)

#### Performance
- [ ] **Caching**
  - Redis for sessions and lobbies
  - React Query for client caching
  - Next.js ISR for static pages

- [ ] **Database optimization**
  - Indexes on hot paths
  - Database pooling (PgBouncer)
  - Prisma Accelerate (optional)

- [ ] **Code splitting**
  - Dynamic imports for games
  - Component lazy loading
  - Bundle size optimization

#### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics or Google Analytics)
- [ ] Logging (Winston or Pino)
- [ ] Health check endpoints
- [ ] Uptime monitoring (UptimeRobot)

#### Deployment
- [ ] **Production environment**
  - Vercel or Railway for hosting
  - Render or Supabase for DB
  - Environment variables management
  
- [ ] **CI/CD**
  - GitHub Actions for tests
  - Auto-deploy on push to main
  - Staging environment

- [ ] **Database migrations**
  - Migrations strategy (`prisma migrate deploy`)
  - Backup strategy
  - Rollback plan

---

### Phase 6: Monetization and growth (optional)

- [ ] **Premium features**
  - Unlimited private lobbies
  - Custom themes/avatars
  - Ad-free experience
  - Exclusive games

- [ ] **Ads**
  - Google AdSense integration
  - Banners between games
  - Respecting user experience

- [ ] **Mobile app**
  - React Native
  - Push notifications
  - App Store / Google Play

---

## 🛠 Technical improvements

### Testing
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] API tests (Supertest)
- [ ] Coverage > 80%

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component Storybook
- [ ] Contribution guidelines
- [ ] Deployment guide

### Developer Experience
- [ ] Husky git hooks
- [ ] ESLint + Prettier config
- [ ] Commit linting (Conventional Commits)
- [ ] GitHub issue templates

---

## 📊 Success metrics

### Technical
- Page load < 2s
- Time to interactive < 3s
- 99.9% uptime
- < 100ms API response time

### Business
- 100+ active users in the first month
- 1000+ games played
- < 5% churn rate
- Average session > 15 minutes

---

## 🎯 Weekly priorities (this week)

1. **[CRITICAL]** Obtain and configure Google/GitHub OAuth credentials
2. **[HIGH]** Test full registration/login flows
3. **[HIGH]** Finish Yahtzee real-time with Socket.IO
4. **[MEDIUM]** Add visual polish (dice animations)
5. **[MEDIUM]** Lobby chat system

---

## 📝 Useful commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema changes to DB

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma migrate dev --name <name>   # Create migration
npx prisma migrate deploy              # Apply migrations (prod)
npx prisma generate                    # Regenerate Prisma Client
npx prisma db seed                     # Seed database (if configured)
```

---

## 🔗 Useful links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

**Last updated:** 2025-10-17
