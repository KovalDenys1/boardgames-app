import { execFileSync } from 'node:child_process'
import path from 'node:path'

/**
 * Runs before the suite. See reset-rate-limits.ts for why, and why it cannot
 * touch a real user's counters.
 *
 * Its own process for the same reason as the teardown: the Prisma-adjacent
 * module graph is ESM and Playwright's transpiler loads it as CommonJS.
 */
export default function globalSetup(): void {
  try {
    const output = execFileSync('npx', ['tsx', path.join(__dirname, 'reset-rate-limits.ts')], {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..', '..'),
    })
    process.stdout.write(`${output.trim()}\n`)
  } catch (error) {
    process.stdout.write(`e2e setup: could not clear rate-limit keys — ${error}\n`)
  }
}
