# Known Issues & Recommendations

## ✅ Fixed Issues

### 1. ✅ OAuth Environment Variables
**Status:** Fixed  
**Issue:** `.env.example` had incorrect variable names `GITHUB_ID` and `GITHUB_SECRET`  
**Fix:** Updated to `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### 2. ✅ Build Script Safety
**Status:** Fixed  
**Issue:** `prisma db push` in build script could cause data loss in production  
**Fix:** Removed `prisma db push` from build script. Use migrations in production.

### 3. ✅ Socket.IO Input Validation
**Status:** Fixed  
**Issue:** No validation on Socket.IO events - potential for crashes  
**Fix:** Added validation for lobby codes and game actions

### 4. ✅ Game State Parsing Error Handling
**Status:** Fixed  
**Issue:** Corrupted JSON in game state would crash the app  
**Fix:** Added try-catch with user-friendly error message

### 5. ✅ Lobby State Management
**Status:** Fixed (December 2024)  
**Issue:** App incorrectly showed game interface when just entering lobby  
**Fix:** Added proper state distinction (isInGame, isGameStarted, isWaitingInLobby)

### 6. ✅ Leave Lobby Confirmation
**Status:** Fixed (December 2024)  
**Issue:** Always asked confirmation even when game not started  
**Fix:** Confirmation only required for active games, different logic for waiting vs playing

### 7. ✅ Prerender Errors
**Status:** Fixed (December 2024)  
**Issue:** useSearchParams() in client component during SSR caused build failures  
**Fix:** Split pages into Suspense wrapper + form component

---

## ⚠️ Current Limitations

### 1. Socket.IO Authentication
**Impact:** Medium  
**Description:** Socket.IO connections don't verify user identity. Anyone can emit events to any lobby if they know the code.

**Recommended Fix:**
```typescript
// In server.ts, add middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  // Verify token with NextAuth
  if (valid) {
    socket.data.userId = userId
    next()
  } else {
    next(new Error('Authentication failed'))
  }
})
```

### 2. Race Conditions in Game State
**Impact:** Medium  
**Description:** Multiple players can update game state simultaneously, leading to inconsistent state.

**Recommended Fix:**
- Save game state to database on every turn
- Add optimistic locking with version numbers
- Validate moves server-side before broadcasting

**Example:**
```typescript
// In API route
const game = await prisma.game.findUnique({ 
  where: { id, version: expectedVersion } 
})
if (!game) throw new Error('Stale game state')

await prisma.game.update({
  where: { id },
  data: { state: newState, version: { increment: 1 } }
})
```

### 3. Missing Reconnection Logic
**Impact:** Low  
**Description:** If a player disconnects and reconnects, they might see stale game state.

**Recommended Fix:**
```typescript
// On socket reconnection
socket.on('reconnect', async (lobbyCode) => {
  const game = await getLatestGameState(lobbyCode)
  socket.emit('game-update', { action: 'full-sync', payload: game.state })
})
```

### 4. No Complete Game State Persistence
**Impact:** Medium  
**Description:** Game state is stored in database but could benefit from more frequent updates.

**Current State:** Game state is saved on game start and when players leave. Additional persistence on every turn would improve reliability.

**Recommended Enhancement:**
```typescript
const handleScoreSelection = async (category: YahtzeeCategory) => {
  const res = await fetch(`/api/game/${game.id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, dice: gameState.dice })
  })
  const { newState } = await res.json()
  setGameState(newState)
  socket.emit('game-action', { lobbyCode: code, action: 'state-change', payload: newState })
}
```

### 5. Turn Validation
**Impact:** Medium  
**Description:** Turn validation is primarily client-side. Server-side validation would prevent cheating.

**Current State:** Clients check if it's their turn before allowing actions. Additional server-side validation recommended for production.

---

## 🚀 Production Checklist

Before deploying to production, ensure:

### Database
- [ ] Create initial migration: `npx prisma migrate dev --name init`
- [ ] Test migrations: `npx prisma migrate deploy`
- [ ] Add database indexes for performance:
  ```prisma
  @@index([code]) // on Lobby
  @@index([lobbyId, status]) // on Game
  ```

### Environment
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `NEXTAUTH_SECRET` (min 32 chars)
- [ ] Set correct `NEXTAUTH_URL` (your production domain)
- [ ] Configure OAuth callback URLs in Google/GitHub consoles
  - Google: `https://yourdomain.com/api/auth/callback/google`
  - GitHub: `https://yourdomain.com/api/auth/callback/github`

### Security
- [ ] Add rate limiting to API routes
- [ ] Sanitize user inputs (Zod schemas already help)
- [ ] Add CORS configuration for Socket.IO
- [ ] Enable HTTPS in production

### Monitoring
- [ ] Add error logging (Sentry, LogRocket, etc.)
- [ ] Monitor database connections (connection pooling)
- [ ] Add uptime monitoring (UptimeRobot, Pingdom)
- [ ] Track Socket.IO connection metrics

### Performance
- [ ] Add Redis for session storage (optional)
- [ ] Enable Next.js ISR for lobby list
- [ ] Optimize Prisma queries (include only needed fields)
- [ ] Add database connection pooling (PgBouncer)

---

## 🐛 How to Report Issues

If you find a bug:
1. Check if it's already listed above
2. Create a GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (browser, OS)
   - Screenshots/logs if applicable

---

## 📚 Additional Resources

- [NextAuth.js Best Practices](https://next-auth.js.org/getting-started/introduction)
- [Socket.IO Authentication](https://socket.io/docs/v4/middlewares/#sending-credentials)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)

---

**Last Updated:** 2025-01-17
