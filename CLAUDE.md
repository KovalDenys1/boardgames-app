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

## Responsive UI — Definition of Done (details: docs/RESPONSIVE.md)

Any change touching layout, a game board, or an in-game view is NOT done until all of:

1. **Uses a shared primitive, never ad-hoc viewport math:**
   - Full-height app page under the header → `.page-shell`
   - Full-height page without header → `.page-shell-full`
   - In-game screen (board + chrome) → `.game-screen` family (`--game-h`); until it
     lands, copy the `.ttt-*` family — never invent a new one
   - Mobile in-game navigation → `MobileTabs` / `MobileTabPanel`
   - Header offset → `var(--bd-header-h)` / `HEADER_HEIGHT_PX` (pending tokens issue)
   - Mobile/desktop split → the shared breakpoint (`desk:` screen,
     `MOBILE_MAX_MEDIA_QUERY`, `useIsMobileViewport()`) — never a raw px value
2. **`npm run ci:quick` passes** — includes `scripts/audit-responsive.ts` (checks
   R1–R7: raw `calc(100dvh - 64px)`, off-token media queries/matchMedia,
   `position:fixed` + hardcoded top, inline vh calc in TSX, width-only board
   sizing, new `--*-h` screen families). Legacy debt lives in
   `scripts/responsive-audit-baseline.json` — migrations must shrink it, new code
   must never grow it.
3. **Playwright MCP screenshot sweep** of every touched route at 320 / 390 / 768 /
   1280 px width (docs/RESPONSIVE.md#verification-procedure covers reaching
   in-game states and breakpoint-boundary checks).
4. **Game-board or mobile fixes: real-device check is the final gate** — emulated
   viewports do not reproduce iOS Safari address-bar dvh behavior. If you cannot
   verify on a real device, say so explicitly instead of claiming the fix works.

## In-game layout — Definition of Done (rule from 2026-09-06)

Every in-game screen must look **finished at every viewport** (320 / 390 / 768 / 1280,
plus 844×390 landscape). Check before calling it done:

1. **No empty regions.** No card with small content floating in it, no column with a
   gap under its last card, no button row with a single button. Boards size to their
   card with container units (`.ttt-board-card` is `container-type: size`); when a
   panel is hidden (chat in bot games) its space is taken by something useful – the
   history card stretched (`.ttt-history-card--fill`), a rules strip.
2. **Shared controls in the same place in every game**, current and future:
   - Leave: top-right, in the `trailing` slot of `GameScoreboardHeader`, via
     `components/game-chrome/GameLeaveButton`; spectators get "Back to lobby" there.
   - Whose turn / status: `GameStatusBanner` directly under the header.
   - Chat: right column on desktop, `GameTabs` tab on mobile.
   - Result: `GameResultOverlay` over the board.
   Exceptions only where a game genuinely needs a different UI, and they are
   written down in the game's ticket.

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
- [ ] **Layout DoD above: Leave in the header trailing slot, no empty regions at 320 / 390 / 768 / 1280.**
- [ ] **In-game chrome comes from the shared kit — never re-implement it.**
      Compose `components/game-chrome/` (`GameResultOverlay`, `GamePlayerCard`,
      `GameScoreboardHeader`, `GameStatusBanner`, `GameTabs`) plus
      `components/Chat.tsx` via `useLobbyChat`/`useLobbyChatHistory` (#736).
      Game-specific identity goes through their props (accent colors, icon
      slots, pre-translated titles) — a hand-rolled player card, result
      overlay, status banner, tab strip, or chat in a game page is a review
      blocker.
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
