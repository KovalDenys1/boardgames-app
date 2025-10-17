import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { username } = await req.json()

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        username,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
