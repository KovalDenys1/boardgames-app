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

    // Create lobby
    const lobby = await prisma.lobby.create({
      data: {
        code,
        name,
        password,
        maxPlayers,
        creatorId: session.user.id,
      },
    })

    return NextResponse.json({ lobby })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create lobby error:', error)
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
          },
        },
        games: {
          where: { status: 'playing' },
          select: { id: true },
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
