/**
 * Turn spectating on for one test lobby.
 *
 * Creating a lobby with spectators enabled is a Premium feature, and the e2e
 * guests are not premium — so the flag is set directly rather than by pretending
 * to be a paying customer. What is under test is the spectator path itself
 * (#845 changed how a spectator learns the realtime topic), not the paywall.
 *
 * Its own process, like the other db helpers: the Prisma client is ESM and
 * Playwright's transpiler loads it as CommonJS.
 */
import { prisma } from '@/lib/db'

async function main() {
  const code = process.argv[2]
  if (!code) throw new Error('usage: enable-spectators.ts <lobby code>')

  await prisma.lobbies.update({
    where: { code },
    data: { allowSpectators: true, maxSpectators: 10 },
  })
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exitCode = 1
})
