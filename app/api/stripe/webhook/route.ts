import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { apiLogger } from '@/lib/logger'
import Stripe from 'stripe'

const log = apiLogger('/api/stripe/webhook')

async function updateSubscriptionState(
  customerId: string,
  subscriptionId: string | null,
  until: Date | null,
  cancelAtPeriodEnd: boolean
) {
  // stripeCustomerId is unique, so this touches at most one row. A zero-row
  // result means we received a subscription for a customer we don't recognise —
  // previously that returned 200 and the entitlement was silently dropped.
  const result = await prisma.users.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      premiumUntil: until,
      stripeSubscriptionId: subscriptionId,
      premiumCancelAtPeriod: cancelAtPeriodEnd,
    },
  })

  if (result.count === 0) {
    log.error('Stripe subscription event matched no user', undefined, {
      customerId,
      subscriptionId,
    })
  }

  return result.count
}

function resolveSubscriptionEnd(subscription: Stripe.Subscription): Date | null {
  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const periodEnd = subscription.items.data[0]?.current_period_end
  return isActive && periodEnd ? new Date(periodEnd * 1000) : null
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await updateSubscriptionState(
        sub.customer as string,
        sub.id,
        resolveSubscriptionEnd(sub),
        sub.cancel_at_period_end
      )
      log.info(`Subscription ${event.type}`, {
        customerId: sub.customer,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateSubscriptionState(sub.customer as string, null, null, false)
      log.info('Subscription deleted', { customerId: sub.customer })
      break
    }

    // Entitlement previously depended entirely on a customer.subscription.*
    // event arriving. If one was missed, a paid checkout never granted Premium
    // and nothing reconciled it. Grant on the checkout itself as well; the
    // subscription events remain the source of truth for renewals and cancels.
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription || !session.customer) {
        break
      }

      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id

      // Re-read the subscription so the period end comes from Stripe rather than
      // being inferred from the checkout session.
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
      await updateSubscriptionState(
        customerId,
        subscriptionId,
        resolveSubscriptionEnd(subscription),
        subscription.cancel_at_period_end
      )
      log.info('Checkout session completed', { customerId, subscriptionId })
      break
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    // Fail loudly rather than letting constructEvent throw an opaque parse error.
    log.error('STRIPE_WEBHOOK_SECRET is not configured; cannot verify webhook')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    log.error('Webhook signature verification failed', err as Error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Claim the event id before doing any work. The primary key makes this atomic:
  // a concurrent or retried delivery of the same event loses the race and exits.
  try {
    await prisma.stripeWebhookEvents.create({
      data: { id: event.id, type: event.type },
    })
  } catch {
    log.info('Ignoring duplicate Stripe event', { eventId: event.id, type: event.type })
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    // Release the claim so Stripe's retry can reprocess this event, rather than
    // having the ledger record a delivery that never took effect.
    await prisma.stripeWebhookEvents
      .delete({ where: { id: event.id } })
      .catch(() => undefined)

    log.error('Webhook handler error', err as Error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
