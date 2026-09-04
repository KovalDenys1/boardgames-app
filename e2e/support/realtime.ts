import type { Page } from '@playwright/test'

/**
 * Wait until a page has actually joined its lobby's realtime topic.
 *
 * There is no signal for this on screen: ConnectionStatus renders nothing while
 * connected, so "the page looks fine" and "the page is subscribed" are
 * indistinguishable. Sending a chat message before the subscription completes
 * would lose it — realtime broadcast has no replay — and the test would fail
 * for a reason that has nothing to do with the code under test.
 *
 * So this listens to the Supabase WebSocket itself and waits for Phoenix to
 * acknowledge the join. That makes it more than a wait: it is the direct
 * evidence that the client subscribed to `lobby:{code}:{secret}` rather than to
 * the guessable `lobby:{code}` (#845), which no assertion about the rendered
 * page could give.
 *
 * Must be called before `goto`, since the socket opens during load.
 */
export function watchRealtimeSubscription(page: Page, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`No realtime subscription to lobby ${code} was acknowledged`)),
      30_000
    )

    page.on('websocket', (ws) => {
      ws.on('framereceived', ({ payload }) => {
        const frame = typeof payload === 'string' ? payload : payload.toString('utf8')
        // Phoenix acknowledges a join with a phx_reply carrying status "ok" on
        // the topic that was joined.
        if (!frame.includes('phx_reply') || !frame.includes('"status":"ok"')) return

        const topic = frame.match(new RegExp(`realtime:(lobby:${code}:[^"\\\\]+)`))
        if (!topic) return

        clearTimeout(timer)
        resolve(topic[1])
      })
    })
  })
}
