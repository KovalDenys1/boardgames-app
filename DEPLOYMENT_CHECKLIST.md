# ✅ Deployment Checklist for boardly.online

## Pre-Deployment Preparation

### ☐ Git Repository
- [ ] Code committed to Git (GitHub/GitLab/Bitbucket)
- [ ] Repository is accessible for Vercel and Render
- [ ] `.env` files are in `.gitignore`

### ☐ Domain
- [ ] Domain `boardly.online` purchased and accessible
- [ ] Access to domain DNS settings

---

## 1. Supabase Setup (15 minutes)

### ☐ Create Project
- [ ] Account created on supabase.com
- [ ] New project created with name "boardly"
- [ ] Strong database password set and saved

### ☐ Get Connection Details
- [ ] Navigate to Settings → Database
- [ ] Copy connection string (URI format)
- [ ] Password replaced in connection string

### ☐ Apply Migrations (Local)
```bash
# Create .env file
echo 'DATABASE_URL="your-connection-string"' > .env

# Install and migrate
npm install
npx prisma migrate deploy
npx prisma generate
```

- [ ] Migrations applied successfully
- [ ] Tables visible in Supabase Table Editor
- [ ] `npx prisma studio` shows all tables

---

## 2. Resend Setup (5 minutes)

### ☐ Create Account & API Key
- [ ] Account created on resend.com
- [ ] API key created (starts with `re_`)
- [ ] API key saved securely

### ☐ Domain Verification (Optional for Production)
- [ ] Domain added in Resend
- [ ] DNS records added to domain provider
- [ ] Domain verified (may take 10-60 minutes)

**Note**: Can skip domain verification for initial testing

---

## 3. Render WebSocket Server (15 minutes)

### ☐ Create Web Service
- [ ] Account created on render.com
- [ ] New Web Service created
- [ ] Git repository connected
- [ ] Service configured:
  - Name: `boardly-websocket`
  - Region: Frankfurt (EU Central)
  - Runtime: Node
  - Build Command: `npm install && npm run db:generate`
  - Start Command: `npm run socket:start`

### ☐ Environment Variables
Add these in Render Dashboard:
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `HOSTNAME=0.0.0.0`
- [ ] `CORS_ORIGIN=https://boardly.online,https://www.boardly.online`
- [ ] `DATABASE_URL` (same as Supabase)

### ☐ Deploy & Verify
- [ ] Service deployed successfully
- [ ] Health check configured: `/health`
- [ ] URL copied (e.g., `https://boardly-websocket.onrender.com`)
- [ ] Health endpoint working: `https://your-service.onrender.com/health` returns `{"ok":true}`

---

## 4. Vercel Frontend (15 minutes)

### ☐ Create Project
- [ ] Account created on vercel.com
- [ ] New project created
- [ ] Git repository connected
- [ ] Framework detected as Next.js

### ☐ Build Configuration
Verify these settings:
- [ ] Build Command: `prisma generate && next build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`

### ☐ Environment Variables
Add all these variables (use templates from `.vercel-env-template.md`):

**Required:**
- [ ] `DATABASE_URL` (from Supabase)
- [ ] `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` = `https://boardly.online`
- [ ] `RESEND_API_KEY` (from Resend)
- [ ] `EMAIL_FROM` = `Boardly <noreply@boardly.online>`
- [ ] `NEXT_PUBLIC_SOCKET_URL` (from Render)

**Optional:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### ☐ Initial Deploy
- [ ] Project deployed successfully
- [ ] Vercel URL working (e.g., `boardly-xyz.vercel.app`)
- [ ] No build errors in logs

---

## 5. Custom Domain Configuration (10-60 minutes)

### ☐ Add Domain to Vercel
- [ ] Navigate to Settings → Domains
- [ ] Added `boardly.online`
- [ ] Added `www.boardly.online`
- [ ] DNS instructions copied from Vercel

### ☐ Configure DNS
In your domain provider (e.g., Cloudflare, GoDaddy):
- [ ] Added A record: `@` → Vercel IP
- [ ] Added CNAME record: `www` → `cname.vercel-dns.com`
- [ ] DNS changes saved

### ☐ Wait for Propagation
- [ ] SSL certificate issued by Vercel (automatic)
- [ ] Domain accessible via `https://boardly.online`
- [ ] `www.boardly.online` redirects to `boardly.online`

### ☐ Update Environment Variables
After domain is working:

**Vercel:**
- [ ] Updated `NEXTAUTH_URL=https://boardly.online`
- [ ] Redeployed project

**Render:**
- [ ] Updated `CORS_ORIGIN=https://boardly.online,https://www.boardly.online`
- [ ] Manually redeployed service

---

## 6. Final Verification

### ☐ Health Checks
Test all endpoints:
- [ ] `https://boardly-websocket.onrender.com/health` → `{"ok":true}`
- [ ] `https://boardly.online` → Site loads
- [ ] `https://boardly.online/api/health` → `{"ok":true}`

### ☐ Authentication Flow
- [ ] Register new account at `/auth/register`
- [ ] Email verification sent
- [ ] Email received successfully
- [ ] Email link works
- [ ] Login works at `/auth/login`

### ☐ Game Functionality
- [ ] Create lobby works
- [ ] Join lobby with code works
- [ ] WebSocket connection established (check browser console)
- [ ] Real-time updates working
- [ ] Chat messages sync between players
- [ ] Game actions sync properly

### ☐ Cross-Browser Testing
- [ ] Chrome/Edge working
- [ ] Firefox working
- [ ] Safari working (if available)
- [ ] Mobile browser working

---

## 7. Monitoring Setup

### ☐ Vercel Monitoring
- [ ] Check Deployments tab for logs
- [ ] Enable Error Tracking if needed
- [ ] Review Analytics

### ☐ Render Monitoring
- [ ] Review Logs tab
- [ ] Check Metrics for uptime
- [ ] Note: Free tier may have cold starts (~30-60s)

### ☐ Supabase Monitoring
- [ ] Review Logs for database queries
- [ ] Check Table Editor for data
- [ ] Monitor API usage

---

## 8. Security Checklist

### ☐ Secrets & Keys
- [ ] All secrets are random and minimum 32 characters
- [ ] No secrets in Git repository
- [ ] `.env` in `.gitignore`
- [ ] All API keys rotated if accidentally exposed

### ☐ CORS & Domain
- [ ] CORS only allows your domain
- [ ] HTTPS enabled everywhere
- [ ] No mixed content warnings

### ☐ Database
- [ ] Strong database password used
- [ ] Connection pooling enabled (Supabase default)
- [ ] No public table access

---

## 9. Performance Optimization

### ☐ Vercel
- [ ] Static assets cached properly
- [ ] Images optimized via Next.js Image component
- [ ] API routes have appropriate caching headers

### ☐ Render
- [ ] Health check endpoint configured
- [ ] Auto-deploy enabled for updates

### ☐ Database
- [ ] Indexes on frequently queried fields (Prisma handles this)
- [ ] Connection pooling enabled

---

## 10. Documentation & Maintenance

### ☐ Documentation
- [ ] `README.md` updated with live URL
- [ ] Environment variables documented
- [ ] Deployment guides saved

### ☐ Backup Strategy
- [ ] Supabase automatic backups enabled (check settings)
- [ ] Git repository backed up
- [ ] Critical environment variables saved securely

### ☐ Monitoring
- [ ] Set up uptime monitoring (optional: uptimerobot.com)
- [ ] Subscribe to Vercel/Render status pages
- [ ] Set up error notifications

---

## 📊 Success Criteria

Your deployment is successful when:
- ✅ `https://boardly.online` loads the homepage
- ✅ User registration and login work
- ✅ Email verification emails are received
- ✅ Lobbies can be created and joined
- ✅ WebSocket real-time updates work
- ✅ Games are playable with multiple players
- ✅ No console errors in browser
- ✅ No errors in Vercel/Render logs

---

## 🐛 Common Issues

### Domain Not Working
- Wait 10-60 minutes for DNS propagation
- Clear browser cache / try incognito mode
- Verify DNS with: `nslookup boardly.online`

### WebSocket Not Connecting
- Check CORS_ORIGIN includes your domain
- Verify NEXT_PUBLIC_SOCKET_URL is correct
- Check Render logs for errors
- Wait 1-2 minutes for cold start (free tier)

### Database Errors
- Verify DATABASE_URL is identical in Vercel and Render
- Check Prisma migrations applied: `npx prisma studio`
- Review Supabase logs

### Email Not Sending
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for logs
- Verify domain if using custom domain

---

## 🎉 Post-Deployment

### ☐ Announcements
- [ ] Share with friends/testers
- [ ] Post on social media
- [ ] Add to portfolio

### ☐ Continuous Improvement
- [ ] Monitor user feedback
- [ ] Track errors and fix
- [ ] Plan new features
- [ ] Regular security updates

---

**Congratulations! Your Boardly project is now live at boardly.online! 🚀**

Need help? Review:
- [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Service logs in Vercel/Render dashboards
