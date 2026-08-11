import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/next-auth'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { apiLogger } from '@/lib/logger'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit'

const log = apiLogger('/api/stripe/reactivate')
const limiter = rateLimit(rateLimitPresets.api)

export async function POST(req: NextRequest) {
  const rateLimitResult = await limiter(req)
  if (rateLimitResult) return rateLimitResult

  // Subscription management requires a real account — getRequestAuthUser would
  // also accept a guest JWT, and a guest can never own a subscription (#718).
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = { id: session.user.id }

  const dbUser = await prisma.users.findUnique({
    where: { id: user.id },
    select: { stripeSubscriptionId: true },
  })

  if (!dbUser?.stripeSubscriptionId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  await getStripe().subscriptions.update(dbUser.stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  // Update DB immediately so UI reflects the change without waiting for the webhook
  await prisma.users.update({
    where: { id: user.id },
    data: { premiumCancelAtPeriod: false },
  })

  log.info('Subscription reactivated', { userId: user.id })
  return NextResponse.json({ success: true })
}
