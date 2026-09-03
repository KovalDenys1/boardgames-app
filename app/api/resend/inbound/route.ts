import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

const log = apiLogger('/api/resend/inbound')

const RESEND_API_URL = 'https://api.resend.com'

// Resend signs webhooks with the svix scheme: HMAC-SHA256 over
// "{svix-id}.{svix-timestamp}.{body}" keyed with the base64 part of the
// whsec_ secret. The svix-signature header can carry several
// space-separated "v1,<base64>" candidates (secret rotation).
function verifySignature(req: NextRequest, body: string): boolean {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET
  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signatures = req.headers.get('svix-signature')
  if (!secret || !id || !timestamp || !signatures) return false

  // Reject stale deliveries to limit replay.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 60 * 5) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest()

  return signatures.split(' ').some((candidate) => {
    const [version, sig] = candidate.split(',')
    if (version !== 'v1' || !sig) return false
    const given = Buffer.from(sig, 'base64')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}

// Resend retries on a non-2xx. A 4xx from its own API is permanent — a deleted
// message, a malformed forward — so answering 500 there just replays the same
// failure on a schedule. Only ask for a retry when the failure could pass
// (network, 429, 5xx) (#824).
function isTransient(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!verifySignature(req, body)) {
    log.error('Inbound webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { type?: string; data?: { email_id?: string } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (event.type !== 'email.received' || !event.data?.email_id) {
    return NextResponse.json({ received: true, ignored: true })
  }

  const forwardTo = process.env.SUPPORT_FORWARD_TO
  const apiKey = process.env.RESEND_API_KEY
  if (!forwardTo || !apiKey) {
    log.error('SUPPORT_FORWARD_TO or RESEND_API_KEY is not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  // The webhook payload is metadata only; the body must be fetched separately.
  const emailRes = await fetch(
    `${RESEND_API_URL}/emails/receiving/${event.data.email_id}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  if (!emailRes.ok) {
    log.error('Failed to fetch received email', undefined, {
      emailId: event.data.email_id,
      status: emailRes.status,
    })
    return NextResponse.json(
      { error: 'Fetch failed' },
      { status: isTransient(emailRes.status) ? 500 : 200 }
    )
  }

  const email: {
    from?: string
    to?: string[]
    subject?: string
    html?: string | null
    text?: string | null
  } = await emailRes.json()

  const sendRes = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Boardly Support <support@boardly.online>',
      to: [forwardTo],
      reply_to: email.from,
      subject: `[${email.to?.[0] ?? 'inbound'}] ${email.subject ?? '(no subject)'}`,
      ...(email.html ? { html: email.html } : {}),
      text: email.text ?? '(no text body)',
    }),
  })

  if (!sendRes.ok) {
    log.error('Failed to forward received email', undefined, {
      emailId: event.data.email_id,
      status: sendRes.status,
    })
    return NextResponse.json(
      { error: 'Forward failed' },
      { status: isTransient(sendRes.status) ? 500 : 200 }
    )
  }

  log.info('Inbound email forwarded', {
    emailId: event.data.email_id,
    from: email.from,
    to: email.to,
  })
  return NextResponse.json({ received: true })
}
