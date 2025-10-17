import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { state, status } = await request.json()

    // Verify user is a player in this game
    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        players: true,
        lobby: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const isPlayer = game.players.some((p: any) => p.userId === session.user.id)
    if (!isPlayer) {
      return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
    }

    // Update game state
    const updatedGame = await prisma.game.update({
      where: { id: params.gameId },
      data: {
        state: JSON.stringify(state),
        status: status || game.status,
        updatedAt: new Date(),
      },
    })

    // Update player scores if game is finished
    if (status === 'finished' && state.scores) {
      await Promise.all(
        game.players.map((player: any, index: number) =>
          prisma.player.update({
            where: { id: player.id },
            data: {
              scorecard: JSON.stringify(state.scores[index] || {}),
              score: calculateTotalFromScorecard(state.scores[index] || {}),
            },
          })
        )
      )
    }

    return NextResponse.json({ game: updatedGame })
  } catch (error) {
    console.error('Update game state error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateTotalFromScorecard(scorecard: any): number {
  const upperSection = (scorecard.ones || 0) + (scorecard.twos || 0) + 
    (scorecard.threes || 0) + (scorecard.fours || 0) + 
    (scorecard.fives || 0) + (scorecard.sixes || 0)
  
  const upperBonus = upperSection >= 63 ? 35 : 0
  
  const lowerSection = (scorecard.threeOfKind || 0) + (scorecard.fourOfKind || 0) +
    (scorecard.fullHouse || 0) + (scorecard.smallStraight || 0) +
    (scorecard.largeStraight || 0) + (scorecard.yahtzee || 0) +
    (scorecard.chance || 0)
  
  return upperSection + upperBonus + lowerSection
}
