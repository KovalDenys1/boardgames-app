import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// This endpoint should be called by a cron job to clean up inactive lobbies
export async function POST(req: NextRequest) {
  try {
    // Verify this is called from a trusted source (optional: add API key check)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find lobbies with no active games and no players
    const lobbiesWithGames = await prisma.lobby.findMany({
      where: {
        isActive: true,
      },
      include: {
        games: {
          where: {
            OR: [
              { status: 'waiting' },
              { status: 'playing' }
            ]
          },
          include: {
            players: true
          }
        }
      }
    })

    const lobbiesToDeactivate: string[] = []

    for (const lobby of lobbiesWithGames) {
      const activeGame = lobby.games[0]
      
      // If no active game, deactivate lobby
      if (!activeGame) {
        lobbiesToDeactivate.push(lobby.id)
        continue
      }

      // If active game has no players, deactivate lobby
      if (activeGame.players.length === 0) {
        lobbiesToDeactivate.push(lobby.id)
        continue
      }

      // Check if lobby has been inactive for more than 24 hours
      const lastUpdated = new Date(activeGame.updatedAt)
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceUpdate > 24) {
        lobbiesToDeactivate.push(lobby.id)
      }
    }

    // Deactivate inactive lobbies
    if (lobbiesToDeactivate.length > 0) {
      await prisma.lobby.updateMany({
        where: {
          id: { in: lobbiesToDeactivate }
        },
        data: {
          isActive: false
        }
      })
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      deactivatedCount: lobbiesToDeactivate.length,
      deactivatedLobbies: lobbiesToDeactivate
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
