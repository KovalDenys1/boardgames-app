# Responsive Layout — Pattern Reference

This document is the single source of truth for viewport/layout patterns in Boardly.
The short workflow contract lives in `CLAUDE.md` ("Responsive UI — Definition of Done");
this file holds the details. Enforced by `scripts/audit-responsive.ts` (part of
`npm run ci:quick`, therefore also pre-push and CI).

**Why this exists:** 30+ responsive bugs recurred over 5 months (#598, #600, #688,
#687, #690, #703, #724, #525, …) because every screen reinvented viewport math:
4 competing CSS shell families, header height hardcoded in 14+ places, and three
conflicting "mobile" breakpoints (767 / 899 / 1024 px) that caused the 768–1023px
double-render bug class. Tracking issue: #733.

## Tokens

| Token | Where | Status |
|---|---|---|
| `--bd-header-h` (64px) | `app/globals.css` `:root`, inside the primitives block | pending (tokens issue) |
| `HEADER_HEIGHT_PX` | `lib/responsive-tokens.ts` | pending (tokens issue) |
| `DESKTOP_MIN_WIDTH_PX` | `lib/responsive-tokens.ts` | pending (breakpoint decision) |
| `MOBILE_MAX_MEDIA_QUERY` | `lib/responsive-tokens.ts` | pending (breakpoint decision) |
| `desk:` Tailwind screen | `tailwind.config.ts` (imported from tokens) | pending (breakpoint decision) |
| `useIsMobileViewport()` | `hooks/useIsMobileViewport.ts` | pending (tokens issue) |

**Why three carriers for one value:** CSS custom properties cannot appear inside
`@media (...)` conditions, so media queries must use a raw px literal. The audit
script (check R2) fails CI on any width media query outside the set derived from
`DESKTOP_MIN_WIDTH_PX` — that is what makes "change the breakpoint in one place"
honest. Until the tokens land, the audit allows the transitional set
{767, 768, 899, 900, 1023, 1024}.

## Breakpoint decision record

**Pending.** Candidates: 900 (current game CSS) vs 1024 (Tailwind `lg`, current
MobileTabs). To be decided by comparing real screens (iPad portrait 768/820, iPad
landscape 1024+, large phone landscape ~850–930) — the deciding question is whether
a portrait tablet gets the desktop side-panel layout or the mobile-tabs layout, and
whether the desktop layout genuinely fits at 900. Record the decision, the
screenshots, and the rationale here when made.

## Primitive catalog

| Primitive | Use for | Status |
|---|---|---|
| `.page-shell` | Full-height app page under the header (incl. loading/error/fallback screens) | exists (`globals.css`) |
| `.page-shell-full` | Full-height page without the header | exists |
| `.game-screen` family (`--game-h`) | In-game screen: board + chrome, mobile tabs + desktop grid | pending — until it lands, copy the `.ttt-*` family |
| `MobileTabs` / `MobileTabPanel` | Mobile in-game navigation (`app/lobby/[code]/components/`) | exists |
| Height-aware cell sizing idiom | Any multi-row board | exists (see below) |

Rules that apply to all of them:

- **The shell uses `height`, never `position: fixed` with a hardcoded `top`.**
  The fixed variant (legacy `.memory-screen`) interacts worst with iOS Safari's
  address-bar show/hide, which changes the resolved `100dvh` at runtime.
- **Always pair `100dvh` with an `@supports` fallback** to `100vh`
  (see `.page-shell` in `globals.css` for the canonical form).
- **Never size a multi-row grid/board from `100vw` alone.** Any board taller than
  one row needs its cell size to be the `min()` of a width-derived AND a
  height-derived value:
  `--cell: min(calc((100vw - <side chrome>px) / cols), calc((var(--game-h) - <vertical chrome>px) / rows))`
  Width-only sizing is blind to vertical space and produces a board silently
  clipped by `overflow: hidden` (bug #688). Working examples: `--c4-cell` and
  `.ttt-board-wrap` in `globals.css`.
- Desktop board cards may use container queries (`container-type: size` + `cqh`) —
  already the pattern in `.ttt-board-card` and the memory grid.
- One screen family. Do not add a new `--<game>-h` variable or `.<game>-screen`
  clone (audit check R7); extend the shared family instead.

## Surface → primitive

| Surface | Primitive |
|---|---|
| Regular page (lists, profile, auth, lobby browser) | `.page-shell` |
| Loading / error / fallback screen | `.page-shell` (same as the page it replaces) |
| In-game screen (any game) | `.game-screen` family (until it lands: `.ttt-*`) |
| In-game mobile navigation | `MobileTabs` + `MobileTabPanel` |
| Header offset in any calc | `var(--bd-header-h)` / `HEADER_HEIGHT_PX` |
| Mobile/desktop conditional in TSX | `useIsMobileViewport()` — never raw `matchMedia('(max-width: Npx)')` |
| Mobile/desktop conditional in classes | `desk:` screen (until it lands: `lg:`) |

## Anti-patterns (audit checks)

Regenerate the baseline after removing legacy violations:
`npx tsx scripts/audit-responsive.ts --update-baseline`.
Point opt-out for a justified exception: a comment containing
`responsive-audit-allow(R2): reason` on the offending line or the line above.

### R1 — raw header-offset viewport math
`calc(100dvh - 64px)` / `calc(100vh - 4rem)` outside the primitives block in
`globals.css`. **Fix:** use `.page-shell` / `.game-screen`, or `var(--bd-header-h)`
inside the primitives block only.

### R2 — width media query off-token
A `(min|max)-width: Npx` media query (or Tailwind `min-[Npx]:`/`max-[Npx]:` variant)
with a value outside the allowed breakpoint set. **Fix:** use the `desk:` screen or
restructure so the shared breakpoint works.

### R3 — hardcoded width in matchMedia()
`window.matchMedia('(max-width: 767px)')` and friends. **Fix:** `useIsMobileViewport()`
/ `MOBILE_MAX_MEDIA_QUERY`. Non-width queries (reduced-motion, display-mode,
color-scheme) are not flagged.

### R4 — position:fixed with hardcoded header offset
`position: fixed` combined with `top: 64px`/`4rem`. **Fix:** a shell primitive with
`height` (see catalog rules).

### R5 — inline viewport-height calc in TSX
`style={{ height: 'calc(100dvh - 200px)' }}` etc. (the header-offset case is R1).
**Fix:** a primitive class, or derive from `--game-h`.

### R6 — width-only board sizing
A `width:`/`--*cell*:` declaration using `100vw` without `min()` and a height
variable. **Fix:** the height-aware cell sizing idiom above.

### R7 — new screen-family variable
A new `--*-h: calc(100dvh …)` outside the primitives block. **Fix:** use the shared
`.game-screen` family.

## Compact mobile patterns

Budget vertical space deliberately in mobile game views — prefer one thin,
always-shrinkable region (the board/scorecard) surrounded by as few
`flex-shrink-0` chrome blocks as possible. Before adding a new status banner/card,
check whether the info already exists on screen (Yahtzee once had a "Your Turn"
banner duplicating both the Next Move card and the timer's color-coding). Reuse:

- **Compact multi-stat header row:** `MemoryGameBoard.tsx`'s `.memory-mobile-header`
  (`globals.css`) — 24px avatars, `padding: 4px 8px`, `font-size: 10–11px`.
- **Collapse-on-tap for secondary info:** `WaitingRoomActions.tsx`'s `useState`
  toggle + rotating-chevron button idiom.
- **Horizontal scroll instead of wrap** for a chip/pill row on narrow screens:
  `LobbyInfo.tsx`'s `overflow-x-auto` rail. No scrollbar-hiding utility exists in
  this codebase — don't add one; the native thin scrollbar is the accepted look.

## Verification procedure

Every UI change, before it is "done":

1. `npm run ci:quick` — includes this audit.
2. **Playwright MCP screenshot sweep** of every touched route at widths
   **320, 390, 768, 1280** (resize → screenshot each). For in-game screens, reach
   a real game state via bot quick-play (every game supports bots; for bot-less
   games use the curl + join-guest API approach). When a change touches the
   mobile/desktop switch, also check `DESKTOP_MIN_WIDTH_PX − 1` and
   `DESKTOP_MIN_WIDTH_PX`: exactly one of desktop-grid / mobile-tabs may render.
3. **Real-device gate** for game-board or mobile fixes: emulated viewports do not
   reproduce iOS Safari's address-bar animation, which changes the resolved
   `100dvh` at runtime — this is only observable on a physical phone (use the
   Vercel preview deployment). If you cannot verify on a real device, say so
   explicitly instead of claiming the fix works.
4. Shell primitives are pinned by className-contract Jest tests (pattern:
   `__tests__/app/lobby-page-fallbacks.test.tsx`) — extend them when adding a
   surface, don't delete them.

## Migration status

| Area | Shell today | Target | Issue |
|---|---|---|---|
| Rule + audit + baseline | — | this document | #733 (this) |
| Tokens + breakpoint decision | 64px hardcoded ×14, three breakpoints | `--bd-header-h`, `responsive-tokens.ts`, `desk:` | planned |
| Tic-Tac-Toe + Connect Four | `.ttt-*` | `.game-screen` | planned |
| Memory | `.memory-*` (position:fixed) | `.game-screen` | planned |
| LobbyPageClient (Yahtzee/Alias/Spy/Sketch/RPS) | inline fixed + JS scroll-lock | `.game-screen` | planned |
| Spy CSS, Liar's Party, spectate, fallbacks, remaining raw calcs | ad-hoc | `.page-shell` / `.game-screen`; baseline deleted | planned |
| Homepage one-off breakpoints (639/720/1059/1060/1120) | ad-hoc | optional, low priority | planned |
