/**
 * @jest-environment @edge-runtime/jest-environment
 */
// @ts-nocheck - Route-level mocks are intentionally lightweight.

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

jest.mock('@/lib/db', () => ({
  prisma: {
    users: { updateMany: jest.fn() },
    stripeWebhookEvents: { create: jest.fn(), delete: jest.fn() },
  },
}))

jest.mock('@/lib/stripe', () => ({
  getStripe: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  apiLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}))

function subscriptionEvent(overrides = {}) {
  return {
    id: 'evt_1',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_1',
        customer: 'cus_new',
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ current_period_end: 1893456000 }] },
        metadata: { userId: 'user_1' },
        ...overrides,
      },
    },
  }
}

function request() {
  return new NextRequest('https://boardly.online/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body: '{}',
  })
}

describe('POST /api/stripe/webhook — entitlement must never be silently dropped', () => {
  let event

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    event = subscriptionEvent()
    getStripe.mockReturnValue({
      webhooks: { constructEvent: jest.fn(() => event) },
      subscriptions: { retrieve: jest.fn() },
    })
    prisma.stripeWebhookEvents.create.mockResolvedValue({})
    prisma.stripeWebhookEvents.delete.mockResolvedValue({})
  })

  afterEach(() => jest.resetAllMocks())

  it('grants premium normally when the customer id matches a user', async () => {
    prisma.users.updateMany.mockResolvedValueOnce({ count: 1 })

    const res = await POST(request())

    expect(res.status).toBe(200)
    expect(prisma.users.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.users.updateMany.mock.calls[0][0].where).toEqual({ stripeCustomerId: 'cus_new' })
  })

  it('recovers via subscription metadata when the stored customer id went stale', async () => {
    // Checkout recreates the Stripe customer when the stored id is stale, so
    // events for the new id match no row until we repair it.
    prisma.users.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })

    const res = await POST(request())

    expect(res.status).toBe(200)
    const repair = prisma.users.updateMany.mock.calls[1][0]
    expect(repair.where).toEqual({ id: 'user_1' })
    // The stored id is repaired so later events resolve directly.
    expect(repair.data.stripeCustomerId).toBe('cus_new')
    expect(repair.data.premiumUntil).toBeInstanceOf(Date)
  })

  it('returns 500 and releases the idempotency claim when no user can be resolved', async () => {
    prisma.users.updateMany.mockResolvedValue({ count: 0 })

    const res = await POST(request())

    // 200 here would tell Stripe the entitlement landed and burn the event id,
    // leaving a paying customer without Premium and no possible redelivery.
    expect(res.status).toBe(500)
    expect(prisma.stripeWebhookEvents.delete).toHaveBeenCalledWith({ where: { id: 'evt_1' } })
  })

  it('does not retry forever when a deleted subscription matches no user', async () => {
    event = subscriptionEvent()
    event.type = 'customer.subscription.deleted'
    prisma.users.updateMany.mockResolvedValue({ count: 0 })

    const res = await POST(request())

    // Nothing left to revoke, so retrying for days would never succeed.
    expect(res.status).toBe(200)
    expect(prisma.stripeWebhookEvents.delete).not.toHaveBeenCalled()
  })

  it('ignores a duplicate delivery of an event already processed', async () => {
    prisma.stripeWebhookEvents.create.mockRejectedValueOnce(new Error('unique violation'))

    const res = await POST(request())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ duplicate: true })
    expect(prisma.users.updateMany).not.toHaveBeenCalled()
  })
})
