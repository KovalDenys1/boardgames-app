#!/usr/bin/env tsx
/**
 * Retroactive Achievement Grant Script (#260)
 *
 * Runs checkAndGrantAchievements() against every non-bot, non-guest user with
 * at least one completed game, so existing users get credit for achievements
 * unlocked before the feature shipped. Safe to re-run any time (e.g. after
 * #729 fixes isWinner-tracking for the remaining 5 game types) — already
 * granted achievements are skipped.
 *
 * Run: npx tsx scripts/grant-retroactive-achievements.ts [--dry-run]
 */

import { prisma } from '../lib/db'
import { checkAndGrantAchievements } from '../lib/achievement-engine'

async function grantRetroactiveAchievements(dryRun: boolean) {
  const candidateUsers = await prisma.users.findMany({
    where: {
      isGuest: false,
      bot: null,
      players: {
        some: {
          game: {
            status: {
              in: ['finished', 'abandoned', 'cancelled'],
            },
          },
        },
      },
    },
    select: { id: true, username: true },
  })

  console.log(`Found ${candidateUsers.length} candidate user(s) with at least one completed game.`)

  if (dryRun) {
    console.log('Dry run — not granting anything.')
    return
  }

  let usersWithNewAchievements = 0
  let totalGranted = 0

  for (const user of candidateUsers) {
    const newlyUnlocked = await checkAndGrantAchievements(user.id)
    if (newlyUnlocked.length > 0) {
      usersWithNewAchievements += 1
      totalGranted += newlyUnlocked.length
      console.log(
        `  ${user.username ?? user.id}: unlocked ${newlyUnlocked.map((a) => a.key).join(', ')}`
      )
    }
  }

  console.log(
    `Done. ${totalGranted} achievement(s) granted across ${usersWithNewAchievements} user(s).`
  )
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  try {
    await grantRetroactiveAchievements(dryRun)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Retroactive achievement grant failed:', error)
  process.exit(1)
})
