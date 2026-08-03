# Claude — Boardly Project Context

## Sprint Process

**Cadence:** 1 week (Mon–Sun). No gaps — every week has a sprint.

**Monday planning (5-10 min):**
1. Pick 3-5 issues from Backlog → label `sprint: current`
2. Update `Boardly.md` → "Current Sprint" section
3. Update `05 Planned.md` → "This Week" with Boardly priorities

**Sunday review:**
1. Check what merged to develop → remove `sprint: current` label, add `sprint: next` for carry-overs
2. Update `Boardly.md` sprint section

**Issue → branch → PR flow:**
1. Issue must exist before writing code
2. Create branch: `feature/<issue-number>-short-description` or `fix/<issue-number>-description`
3. Commit: `#<issue-number> feat/fix/chore: description`
4. PR → `develop`, title: `#<issue> type: description`

**Labels to use on every issue:**
- Priority: `priority:critical` / `priority:high` / `priority:medium` / `priority:low`
- Size: `size: XS` (<1h) / `size: S` (1-3h) / `size: M` (3-8h) / `size: L` (>8h, split it)
- Category: `type:feature` / `type:bug` / `type:game` / etc.
- Sprint: `sprint: current` / `sprint: next`

---

## Branching strategy
- `develop` — integration branch, all feature PRs merge here first
- `main` — production, only merges from `develop` via PR
- `release/vX.Y.Z` — release branch (develop → main PR)
- `hotfix/description` — critical prod fix, merges directly to main + develop

## Rules for merging to main
**NEVER open a PR develop → main unless ALL of the following are true:**
1. All GitHub Actions checks on the `develop` branch are green (CI passes)
2. Full test suite passes: `pnpm test` shows 0 failures
3. No unresolved review comments on the PR
4. Vercel preview build for the PR has deployed successfully

**Before opening the PR, verify:**
```bash
pnpm test          # must be 0 failures
npm run ci:quick   # lint + typecheck + arch audit
```

Check GitHub Actions for the develop branch — all checks must be green before creating the PR. If any check is red, fix it first, then open the PR.

## Migrations
- `prisma migrate deploy` is NOT part of the Vercel build (it hangs cross-region)
- Migrations run automatically via GitHub Actions when `prisma/migrations/` changes on develop (workflow: `.github/workflows/migrate.yml`)
- To run manually: `npm run db:migrate`

## Git hooks
- `pre-commit`: runs `git --no-pager diff --cached --check` + locale parity check
- `pre-push`: blocks direct push to main, runs db:generate + ci:quick + smoke tests

## Release Process

**Versioning: SemVer** — `vMAJOR.MINOR.PATCH`
- PATCH: bug fixes only
- MINOR: new features, new games
- MAJOR: breaking DB/auth changes

**To cut a release:**
```bash
git checkout develop && git pull
git checkout -b release/vX.Y.Z
gh pr create --base main --title "Release vX.Y.Z"
# After merge:
gh release create vX.Y.Z --generate-notes --title "Boardly vX.Y.Z"
```

Release notes are auto-drafted by `.github/workflows/release-drafter.yml` based on PR labels.

---

## Stack
- Next.js 16, React 19, TypeScript, Tailwind CSS
- PostgreSQL via Supabase, Prisma 7
- Auth: NextAuth, Supabase Realtime (Broadcast + Postgres Changes)
- Deployed on Vercel (iad1 / US East)

## Mobile responsiveness rules

Learned from real bugs (#687, #688) that emulated-viewport testing missed —
apply these whenever touching any game board or in-game mobile view.

- **Never size a multi-row grid/board from `100vw` alone.** Any board taller
  than it is a single row (Connect Four's 7x6, not Tic-Tac-Toe's square 3x3)
  needs its cell size to be the `min()` of a width-derived value AND a
  height-derived value using the shared `--ttt-h` custom property
  (`app/globals.css`, `.ttt-screen`). Width-only sizing is blind to vertical
  space and can produce a board taller than the real usable viewport,
  silently clipped by `overflow:hidden` — this is exactly what happened in
  #688. See `.ttt-board-card`'s `--c4-cell` rule for the pattern to copy.
- **Emulated viewports (Playwright/Chrome DevTools device mode) do not
  reproduce real mobile browser chrome.** iOS Safari's address bar
  show/hide animation changes the resolved `100dvh` of any `position:fixed`
  element sized with `calc(100dvh - ...)` — this can only be observed on a
  real device, never in a resized desktop browser window. A mobile
  responsiveness fix is not "verified" until checked on a real phone
  screenshot. If browser automation tooling is unavailable, say so
  explicitly rather than claiming a fix works.
- **Budget vertical space deliberately in mobile game views — don't stack
  full-size info cards.** Prefer one thin, always-shrinkable region (the
  actual board/scorecard) surrounded by as few `flex-shrink-0` chrome
  blocks as possible. Before adding a new status banner/card to a mobile
  game view, check whether the info already exists somewhere else on
  screen (Yahtzee had a "Your Turn" banner duplicating both the Next Move
  card's copy and the timer's color-coded urgency). Reuse the codebase's
  own compact patterns instead of inventing new ones:
  - Compact multi-stat header row: `MemoryGameBoard.tsx`'s
    `.memory-mobile-header` (`app/globals.css`) — 24px avatars,
    `padding:4px 8px`, `fontSize:10-11px`.
  - Collapse-on-tap for secondary info: `WaitingRoomActions.tsx`'s
    `useState` toggle + rotating-chevron button idiom.
  - Horizontal scroll instead of wrap for a chip/pill row on narrow
    screens: `LobbyInfo.tsx`'s `overflow-x-auto` rail (no
    scrollbar-hiding utility exists in this codebase — don't add one,
    the native thin scrollbar is the accepted look).

## Adding a new game — checklist

### Code
- [ ] `lib/games/<game>-game.ts` — game engine extending `GameEngine`
- [ ] `lib/bots/<game>/` — bot + bot-executor (if bot support needed)
- [ ] `lib/bots/core/bot-factory.ts` — add `case '<game>'` to `createBot()` and `executeBotTurn()`
- [ ] `lib/bots/index.ts` — re-export new bot classes
- [ ] `lib/game-registry.ts` — add to `RegisteredGameType` union + `REGISTRY` object
- [ ] `lib/restore-game-engine-client.ts` — add to `CLIENT_RESTORABLE_GAME_TYPES` + switch case
- [ ] `lib/bot-profiles.ts` — add bot display names for easy/medium/hard
- [ ] `lib/analytics.ts` — add to `AnalyticsGameType` union + `source` type if using dedicated lobby page

### Catalog & routing
- [ ] `lib/game-catalog.ts` — add entry to `FEATURED_GAME_CATALOG` with `availability`, `lobbyCreateConfig` (auto-covers create page)
- [ ] `lib/public-game-access.ts` — add to `GAME_LOBBIES_ROUTES`
- [ ] `lib/lobby-page-routing.ts` — add to `DedicatedLobbyPageGameType` + `DEDICATED_LOBBY_PAGE_GAME_TYPES`
- [ ] `components/GameIcon.tsx` — add SVG case for the game

### Database
- [ ] `prisma/schema.prisma` — add value to `GameType` enum
- [ ] Create migration: add file to `prisma/migrations/<timestamp>_add_<game>_game_type/migration.sql` with `ALTER TYPE "GameType" ADD VALUE '<game>';`
- [ ] Run `npx prisma generate` then `npm run db:migrate`

### Pages & UI
- [ ] `app/games/<game>/page.tsx` — detail page with SEO metadata + JSON-LD
- [ ] `app/games/<game>/ConnectFourDetailContent.tsx` (or similar) — client content component
- [ ] `app/games/<game>/lobbies/page.tsx` — lobbies list page (use `GameLobbiesPage`)
- [ ] `app/lobby/[code]/<game>-page.tsx` — full game UI (dedicated lobby page)
- [ ] `app/lobby/[code]/LobbyPageClient.tsx` — add dynamic import + route check
- [ ] `components/HomePage/GameRibbon.tsx` — add to `GAME_ACCENT_BG`, `GAME_DETAIL_HREF`, `translatedDetails`, `getIllustration`

### Locales
- [ ] `locales/en.ts`, `ru.ts`, `no.ts`, `uk.ts` — add complete `games.<game>` namespace (parity enforced by pre-commit hook)

### Verify
```bash
npx tsc --noEmit   # must be clean
pnpm test          # must be 0 failures
npm run ci:quick   # lint + typecheck + arch audit
```
