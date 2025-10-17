# Email Service Setup Guide

This guide explains how to set up email sending for password reset and verification features.

## Email Provider: Resend

We use [Resend](https://resend.com/) for sending transactional emails. It's free for up to 100 emails/day and 3,000 emails/month.

## Setup Steps

### 1. Create Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with your email or GitHub
3. Verify your email address

### 2. Get API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it (e.g., "BoardGames Production")
4. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="BoardGames <noreply@yourdomain.com>"
```

**Important**: 
- In development, you can use `onboarding@resend.dev` as the FROM address
- In production, you need to verify your domain

### 4. Domain Verification (Production Only)

For production, verify your domain to send from your own email address:

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually a few minutes)
6. Update `EMAIL_FROM` to use your domain: `BoardGames <noreply@yourdomain.com>`

## Email Templates

The app includes three email templates:

### 1. Password Reset Email
Sent when user requests password reset via "Forgot Password" link.

**Features:**
- Secure token-based reset link
- 1-hour expiration
- Clear call-to-action button
- Fallback plain text link

**Endpoint**: `/api/auth/forgot-password`

### 2. Email Verification (Future)
Ready for email verification implementation.

**Features:**
- 24-hour expiration token
- Welcome message
- Account activation link

**Status**: Template ready, not yet integrated with registration flow

### 3. Welcome Email (Future)
Sent after email verification.

**Features:**
- Personalized greeting
- Getting started guide
- Quick links to app features

**Status**: Template ready, not yet integrated

## Testing Email Sending

### In Development

1. Set `RESEND_API_KEY` in `.env.local`
2. Use test email address
3. Go to `/auth/forgot-password`
4. Enter your email
5. Check your inbox for password reset email

### Without API Key

If `RESEND_API_KEY` is not set:
- App will still work
- Email sending will be skipped
- Console will show warning: "RESEND_API_KEY not configured"
- User will see success message but won't receive email

## Security Features

✅ **Token Expiration**: Reset tokens expire after 1 hour
✅ **One-Time Use**: Tokens are deleted after use
✅ **Email Enumeration Protection**: Always shows success message, even if email doesn't exist
✅ **Secure Token Generation**: Uses crypto.randomBytes (32 bytes)
✅ **Database Cleanup**: Old tokens are automatically deleted

## Troubleshooting

### Emails not arriving?

1. **Check spam folder** - Transactional emails often land in spam
2. **Verify API key** - Make sure it's correct and not expired
3. **Check domain status** - If using custom domain, ensure it's verified
4. **Review logs** - Check server logs for error messages
5. **Test with different email** - Some providers block transactional emails

### Common Errors

**"Email service not configured"**
- `RESEND_API_KEY` not set in environment variables
- Solution: Add API key to `.env.local`

**"Failed to send email"**
- Invalid API key
- Domain not verified (for custom domains)
- Resend service down (rare)
- Check Resend dashboard for delivery logs

**"Invalid or expired token"**
- Token expired (>1 hour old)
- Token already used
- Token not found in database
- Solution: Request new password reset

## Rate Limits

Resend Free Tier:
- 100 emails/day
- 3,000 emails/month
- No credit card required

For higher limits, upgrade to paid plan.

## Email Analytics

View email delivery status in Resend dashboard:
- Sent emails
- Delivered
- Bounced
- Opened (optional tracking)
- Clicked (optional tracking)

## Best Practices

1. **Always test in development** before deploying
2. **Use environment-specific FROM addresses**
3. **Monitor delivery rates** in Resend dashboard
4. **Keep email templates mobile-friendly**
5. **Provide plain text fallback** for all emails
6. **Include unsubscribe link** for marketing emails (not required for transactional)

## Next Steps

To enable email verification on registration:

1. Uncomment email verification logic in `/api/auth/register`
2. Send verification email after successful registration
3. Create `/auth/verify-email` page to handle token
4. Update user's `emailVerified` field on success
5. Send welcome email after verification

---

For questions or issues, refer to [Resend Documentation](https://resend.com/docs)
