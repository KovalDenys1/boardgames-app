import { execFileSync } from 'node:child_process'
import path from 'node:path'

/**
 * Remove the test lobbies once the run is over.
 *
 * The suite talks to the real Supabase project, because Supabase Realtime is
 * the thing being tested. That is a fine reason to touch the real database and
 * no reason to leave litter in it — the repo already carries a standing "dev DB
 * test-data cleanup" item from exactly this kind of accumulation.
 */
export default function globalTeardown(): void {
  try {
    const output = execFileSync('npx', ['tsx', path.join(__dirname, 'cleanup.ts')], {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..', '..'),
    })
    process.stdout.write(`\n${output.trim()}\n`)
  } catch (error) {
    process.stdout.write(`\ne2e teardown: could not remove test lobbies — ${error}\n`)
  }
}
