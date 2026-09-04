/**
 * Deletes the lobbies the end-to-end tests created.
 *
 * Run as its own process by the global teardown rather than imported into it:
 * the Prisma client is ESM and uses import.meta, which Playwright's transpiler
 * loads as CommonJS and chokes on. tsx is what every other script in this repo
 * uses, and it handles it.
 */
import { prisma } from '@/lib/db'
import { E2E_LOBBY_MARKER } from './marker'

async function main() {
  const { count } = await prisma.lobbies.deleteMany({
    where: { name: { startsWith: E2E_LOBBY_MARKER } },
  })
  // Games and Players cascade from Lobbies, so this is the whole cleanup. The
  // guest users are left to the existing guest purge, which is what removes
  // every other abandoned guest.
  console.log(`e2e cleanup: removed ${count} test ${count === 1 ? 'lobby' : 'lobbies'}`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.warn('e2e cleanup failed —', error)
  await prisma.$disconnect()
  process.exitCode = 0 // never fail a green run on cleanup
})
