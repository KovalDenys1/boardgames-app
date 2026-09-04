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
| `alias-three-players.spec.ts` — three teams of one, one describer and two guessers | playing a three-handed Alias round (#847) |

The first of these found #852 on its first real run.

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
