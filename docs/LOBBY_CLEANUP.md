# Lobby Cleanup System

## Overview
The lobby cleanup system automatically deactivates lobbies that are no longer active to keep the database clean and improve performance.

## How it Works

### Automatic Cleanup Triggers
A lobby will be automatically deactivated if:
1. **No Active Game**: The lobby has no games with status 'waiting' or 'playing'
2. **No Players**: The active game has 0 players
3. **Inactive for 2 Hours**: The game hasn't been updated in the last 2 hours

### Cleanup Execution
The cleanup runs automatically when:
- **User visits lobby list page**: Each time someone opens `/lobby`, cleanup runs in background
- **Zero cost**: No cron jobs needed, uses existing user traffic
- **Non-blocking**: Runs silently, doesn't affect user experience
- **Distributed load**: Cleanup workload distributed across user visits

### Manual Player Leave
When a player leaves a lobby:
- The player is removed from the game
- If only 1 or 0 players remain, the game status is set to 'finished'
- If 0 players remain, the lobby is deactivated immediately

## No Configuration Required! 🎉

The cleanup system works out of the box with no setup needed:
- ✅ No cron jobs to configure
- ✅ No environment variables needed
- ✅ No paid subscriptions required
- ✅ Fully automatic and maintenance-free

## Testing

### Manual Test
You can manually trigger cleanup by visiting the lobby page or calling:

```bash
curl -X POST http://localhost:3000/api/lobby/cleanup
```

### Expected Response
```json
{
  "message": "Cleanup completed",
  "deactivatedCount": 3
}
```

## Monitoring
- Check your deployment logs for cleanup execution
- Monitor the `isActive` field in the `Lobby` table
- Cleanup runs every time a user visits `/lobby` page

## Future Improvements (When Using Paid Hosting)

If you upgrade to a paid plan with cron job support, you can set up scheduled cleanup:

### Option 1: Render.com Cron Jobs
1. Add `CRON_SECRET` to environment variables
2. Create cron job: `curl -X POST https://your-domain.com/api/lobby/cleanup`
3. Schedule: `0 */6 * * *` (every 6 hours)

### Option 2: GitHub Actions
Create `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Lobbies

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: curl -X POST https://your-domain.com/api/lobby/cleanup
```

### Option 3: Vercel Cron Jobs
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/lobby/cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Performance Notes
- Cleanup typically takes <100ms
- Only runs database query when needed
- Scales well with user traffic
- More users = more frequent cleanup = cleaner database
