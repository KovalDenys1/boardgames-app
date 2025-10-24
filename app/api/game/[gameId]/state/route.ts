import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'
import { YahtzeeGame } from '@/lib/games/yahtzee-game'
import { ChessGame } from '@/lib/games/chess-game'
import { Move } from '@/lib/game-engine'

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

    const { move } = await request.json()

    if (!move || !move.type) {
      return NextResponse.json({ error: 'Invalid move data' }, { status: 400 })
    }

    // Get game from database
    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
        lobby: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Verify user is a player in this game
    const playerRecord = game.players.find((p: any) => p.userId === session.user.id)
    if (!playerRecord) {
      return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
    }

    // Recreate game engine from saved state
    const gameState = JSON.parse(game.state)
    let gameEngine: any

    switch (game.lobby.gameType) {
      case 'yahtzee':
        gameEngine = new YahtzeeGame(game.id)
        // Restore state
        gameEngine.state = gameState
        break
      case 'chess':
        gameEngine = new ChessGame(game.id)
        // Restore state
        gameEngine.state = gameState
        break
      default:
        return NextResponse.json({ error: 'Unsupported game type' }, { status: 400 })
    }

    // Create move object
    const gameMove: Move = {
      playerId: session.user.id,
      type: move.type,
      data: move.data || {},
      timestamp: new Date(),
    }

    // Make the move
    const moveResult = gameEngine.makeMove(gameMove)
    if (!moveResult) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 })
    }

    // Update game state in database
    const updatedGame = await prisma.game.update({
      where: { id: params.gameId },
      data: {
        state: JSON.stringify(gameEngine.getState()),
        status: gameEngine.getState().status,
        currentTurn: gameEngine.getState().currentPlayerIndex,
        updatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    // Update player scores
    await Promise.all(
      gameEngine.getPlayers().map(async (player: any, index: number) => {
        const dbPlayer = updatedGame.players[index]
        if (dbPlayer) {
          await prisma.player.update({
            where: { id: dbPlayer.id },
            data: {
              score: player.score || 0,
              scorecard: JSON.stringify(gameEngine.getScorecard?.(player.id) || {}),
            },
          })
        }
      })
    )

    return NextResponse.json({
      game: {
        id: updatedGame.id,
        status: updatedGame.status,
        state: gameEngine.getState(),
        players: updatedGame.players.map(p => ({
          id: p.userId,
          name: p.user.name || 'Unknown',
          score: p.score,
        })),
      }
    })
  } catch (error) {
    console.error('Update game state error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
