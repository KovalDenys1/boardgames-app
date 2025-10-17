# Lobby Cleanup System

## Overview
The lobby cleanup system automatically deactivates lobbies that are no longer active to keep the database clean and improve performance.

## How it Works

### Automatic Cleanup Triggers
A lobby will be automatically deactivated if:
1. **No Active Game**: The lobby has no games with status 'waiting' or 'playing'
2. **No Players**: The active game has 0 players
3. **Inactive for 24 Hours**: The game hasn't been updated in the last 24 hours

### Manual Player Leave
When a player leaves a lobby:
- The player is removed from the game
- If only 1 or 0 players remain, the game status is set to 'finished'
- If 0 players remain, the lobby is deactivated

## Setting Up the Cleanup Cron Job

### 1. Add Environment Variable
Add `CRON_SECRET` to your `.env` file:
```bash
CRON_SECRET=your-secure-random-string-min-32-characters
```

### 2. Configure Cron Job (Render.com)
If hosting on Render.com:

1. Go to your Dashboard
2. Select your Web Service
3. Go to "Cron Jobs" tab
4. Click "Add Cron Job"
5. Configure:
   - **Name**: Lobby Cleanup
   - **Command**: `curl -X POST https://your-domain.com/api/lobby/cleanup -H "Authorization: Bearer YOUR_CRON_SECRET"`
   - **Schedule**: `0 */6 * * *` (every 6 hours)

### 3. Alternative: GitHub Actions
Create `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Lobbies

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X POST https://your-domain.com/api/lobby/cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then add `CRON_SECRET` to GitHub Secrets.

### 4. Alternative: Vercel Cron Jobs
If using Vercel, add to `vercel.json`:

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

## Testing

### Manual Test
```bash
curl -X POST http://localhost:3000/api/lobby/cleanup \
  -H "Authorization: Bearer your-cron-secret"
```

### Expected Response
```json
{
  "message": "Cleanup completed",
  "deactivatedCount": 3,
  "deactivatedLobbies": ["lobby-id-1", "lobby-id-2", "lobby-id-3"]
}
```

## Monitoring
- Check your deployment logs for cleanup execution
- Monitor the `isActive` field in the `Lobby` table
- Track deactivated lobbies count over time

## Security
- The cleanup endpoint requires a secret token in the Authorization header
- Never expose your `CRON_SECRET` in client-side code or public repositories
- Rotate the secret regularly for security
