/**
 * Guards #801: the lobby realtime topic is not private and lobby codes are four
 * digits, so anyone who enumerates codes can subscribe. Posting and reading chat
 * are gated on membership, but that gate is worthless if the message text is
 * then broadcast onto an open topic.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.join(__dirname, '..', '..')

describe('realtime broadcasts carry nothing private (#801)', () => {
  it('does not put the chat body on the lobby topic', () => {
    const source = readFileSync(path.join(root, 'app/api/lobby/[code]/chat/route.ts'), 'utf8')
    const call = source.slice(source.indexOf("broadcastToLobby(code, 'chat-message'"))
    // Skip past the event name itself, which of course contains "message".
    const payload = call.slice(call.indexOf('{'), call.indexOf('})'))

    expect(payload).toContain('id:')
    expect(payload).toContain('timestamp:')
    // The whole point: no message text and no author name on an open topic.
    expect(payload).not.toContain('message')
    expect(payload).not.toContain('username')
  })

  it('never falls back to an email address for a broadcast display name', () => {
    for (const file of ['app/api/lobby/[code]/kick-player/route.ts', 'lib/lobby-leave.ts']) {
      const source = readFileSync(path.join(root, file), 'utf8')
      expect(source).not.toMatch(/username\s*\|\|\s*[\w.]*\.email/)
    }
  })
})
