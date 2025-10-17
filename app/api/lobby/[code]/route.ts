import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const lobby = await prisma.lobby.findUnique({
      where: { code: params.code },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        games: {
          where: { status: { in: ['waiting', 'playing'] } },
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
    }

    return NextResponse.json({ lobby })
  } catch (error) {
    console.error('Get lobby error:', error)
    // Логируем подробности ошибки
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: params.code
      })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Verify authentication with NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lobby = await prisma.lobby.findUnique({
      where: { code: params.code },
      include: {
        games: {
          where: { status: { in: ['waiting', 'playing'] } },
        },
      },
    })

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
    }

    // Check password if set
    const body = await request.json()
    if (lobby.password && body.password !== lobby.password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
    }

    // Find or create active game
    let game = lobby.games.find((g: any) => g.status === 'waiting')

    if (!game) {
      // Create new game
      game = await prisma.game.create({
        data: {
          lobbyId: lobby.id,
          state: JSON.stringify({ round: 0 }),
          status: 'waiting',
        },
      })
    }

    // Check if player already joined
    const existingPlayer = await prisma.player.findUnique({
      where: {
        gameId_userId: {
          gameId: game.id,
          userId: session.user.id,
        },
      },
    })

    if (existingPlayer) {
      return NextResponse.json({ game, player: existingPlayer })
    }

    // Count current players
    const playerCount = await prisma.player.count({
      where: { gameId: game.id },
    })

    if (playerCount >= lobby.maxPlayers) {
      return NextResponse.json(
        { error: 'Lobby is full' },
        { status: 400 }
      )
    }

    // Add player to game
    const player = await prisma.player.create({
      data: {
        gameId: game.id,
        userId: session.user.id,
        position: playerCount,
        scorecard: JSON.stringify({}),
      },
    })

    return NextResponse.json({ game, player })
  } catch (error) {
    console.error('Join lobby error:', error)
    // Логируем подробности ошибки
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: params.code
      })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
