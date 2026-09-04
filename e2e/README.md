# End-to-end tests

```
npm run test:e2e        # headless
npm run test:e2e:ui     # Playwright's UI mode, for debugging a failure
```

Playwright starts `next dev` on **port 3100** by itself — 3000 is often taken by
another project, and `reuseExistingServer` will happily hand the suite whatever
is already answering there.

## Why these exist

The Jest suite mocks Supabase. That is right for 1148 unit tests, and it means
they cannot see the one thing that actually breaks a lobby: a client subscribed
to a different realtime topic than the server broadcasts to, or a message whose
body never arrives. Neither raises an error anywhere — the lobby just goes
quiet.

Three tests, each standing in for a check that used to be done by hand:

| Test | Replaces |
|---|---|
| `realtime-chat.spec.ts` — a message written in one browser arrives in another | opening two windows and typing into both (#801, #845) |
| `realtime-chat.spec.ts` — every player can resolve the topic, nobody else can | — |
| `realtime-chat.spec.ts` — a message is still there after a reload | checking chat history survives (#854) |
| `alias-three-players.spec.ts` — three teams of one, one describer and two guessers | playing a three-handed Alias round (#847) |

These found #852 and both halves of #854.

## How they are built

**Setup goes through the API, assertions go through the browser.** Lobbies and
players are created over HTTP because the entry and lobby-creation screens carry
almost no test ids, and driving them would make every test fragile in a way that
has nothing to do with what is being tested. A guest identity is three
localStorage keys, so each player gets its own browser context seeded with them
— two tabs in one context would share storage and be the same person.

**Waiting is on the WebSocket, not on a timer.** Realtime broadcast has no
replay, so a message sent before both sides have joined is simply lost.
`watchRealtimeSubscription` waits for Phoenix to acknowledge the join, which is
also the direct evidence that the client subscribed to `lobby:{code}:{secret}`
rather than the guessable bare name.

## They talk to the real database

Supabase Realtime is the thing under test, so a local Postgres would remove the
only reason these tests exist. Consequences:

- They need `.env.local` and **cannot run in CI**, which has no secrets.
- Every lobby they create is named `E2E — …` and the global teardown deletes it.
  Games and players cascade; guest users are left to the existing guest purge.
- One guest identity is cached in `e2e/.auth/host.json` (gitignored) and reused,
  because `/api/auth/guest-session` allows five requests per fifteen minutes and
  a suite that fails on its fourth run of the afternoon teaches you to stop
  running it.
- The global setup clears the loopback rate-limit counters. Since #854 those
  counters are shared in Redis rather than per-process, so restarting the dev
  server no longer forgives them and two runs would exhaust the lobby-create
  limit for the rest of the window. Only `::1`, `127.0.0.1` and `unknown` keys
  are touched — behind Vercel the limiter always keys on a real address, so this
  cannot reach anybody else's counters.

## If a change to `lib/` seems to have no effect

Playwright reuses a dev server that is already listening on 3100. Next's dev
server hot-reloads most things but keeps module-level state — the memoised Redis
client, for one — so a change to how a client is constructed needs the server
restarted: `lsof -ti:3100 | xargs kill -9`. This cost half an hour once already.
