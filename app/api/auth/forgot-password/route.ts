import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Security: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({
        message: 'If an account exists with that email, you will receive password reset instructions.',
      })
    }

    // TODO: Generate reset token and send email
    // For now, this is a placeholder
    // In production, you would:
    // 1. Generate a unique token with expiration (e.g., 1 hour)
    // 2. Store token in database (VerificationToken table or new PasswordReset table)
    // 3. Send email with reset link containing the token
    // 4. Token would be: https://your-domain.com/auth/reset-password?token=xyz

    console.log(`Password reset requested for: ${email}`)
    console.log(`TODO: Send email to ${email} with reset link`)

    // For development, log the reset link
    if (process.env.NODE_ENV === 'development') {
      const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      console.log(`\n🔑 Password Reset Link (DEV ONLY):`)
      console.log(`http://localhost:3000/auth/reset-password?token=${mockToken}`)
      console.log(`\n`)
    }

    return NextResponse.json({
      message: 'If an account exists with that email, you will receive password reset instructions.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
