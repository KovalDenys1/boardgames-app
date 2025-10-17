import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'
import { generateLobbyCode } from '@/lib/lobby'

const createLobbySchema = z.object({
  name: z.string().min(1).max(50),
  password: z.string().optional(),
  maxPlayers: z.number().min(2).max(8).default(4),
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication with NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, password, maxPlayers } = createLobbySchema.parse(body)

    // Generate unique lobby code
    let code = generateLobbyCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.lobby.findUnique({ where: { code } })
      if (!existing) break
      code = generateLobbyCode()
      attempts++
    }

    // Create lobby with initial game and add creator as first player
    const lobby = await prisma.lobby.create({
      data: {
        code,
        name,
        password,
        maxPlayers,
        creatorId: user.id,
        games: {
          create: {
            status: 'waiting',
            state: JSON.stringify({
              round: 0,
              currentPlayerIndex: 0,
              dice: [1, 1, 1, 1, 1],
              held: [false, false, false, false, false],
              rollsLeft: 3,
              scores: [{}], // First player's empty scorecard
              finished: false,
            }),
            players: {
              create: {
                userId: user.id,
                position: 0,
                scorecard: JSON.stringify({}),
              },
            },
          },
        },
      },
      include: {
        games: {
          where: { status: 'waiting' },
          include: {
            players: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      lobby,
      autoJoined: true,
      message: 'Lobby created and you have been added as the first player!'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create lobby error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'User account not found. Please log out and log in again.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get active lobbies
    const lobbies = await prisma.lobby.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
        games: {
          where: { status: 'playing' },
          select: { 
            id: true,
            status: true,
            _count: {
              select: {
                players: true
              }
            }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ lobbies })
  } catch (error) {
    console.error('Get lobbies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
