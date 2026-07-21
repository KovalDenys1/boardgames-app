import { prisma } from './db'

/**
 * Check if a user is a bot by userId
 */
export async function isBot(userId: string): Promise<boolean> {
  const bot = await prisma.bots.findUnique({
    where: { userId },
    select: { id: true }
  })
  return !!bot
}

/**
 * Create a bot user with bot record
 */
export async function createBot(
  username: string,
  botType: string = 'generic',
  difficulty: string = 'medium'
) {
  return await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.users.create({
      data: {
        username,
        isGuest: false,
        email: `${username.toLowerCase().replace(/\s/g, '_')}@bot.boardly.online`,
      }
    })
    
    // Create bot record
    const bot = await tx.bots.create({
      data: {
        userId: user.id,
        botType,
        difficulty,
      }
    })
    
    return { user, bot }
  })
}

function findBotProfileUser(username: string, botType: string, difficulty: string) {
  return prisma.users.findFirst({
    where: {
      username,
      bot: {
        is: {
          botType,
          difficulty,
        },
      },
    },
    include: {
      bot: true,
    },
  })
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

/**
 * Get existing bot user by profile or create one.
 * Handles concurrent creation races by re-reading after unique constraint conflicts.
 */
export async function getOrCreateBotUser(
  username: string,
  botType: string = 'generic',
  difficulty: string = 'medium',
) {
  const existing = await findBotProfileUser(username, botType, difficulty)
  if (existing) {
    return existing
  }

  try {
    const { user, bot } = await createBot(username, botType, difficulty)
    return {
      ...user,
      bot,
    }
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) {
      throw error
    }

    const raced = await findBotProfileUser(username, botType, difficulty)
    if (raced) {
      return raced
    }

    throw error
  }
}
