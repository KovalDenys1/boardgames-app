# Quick Guide: Finding Sound Effects

## Recommended Sounds for Each Effect

### 1. dice-roll.mp3 🎲
**Search terms**: "dice roll", "dice shake", "dice throw", "board game dice"
**Duration**: 1-2 seconds
**Character**: Realistic dice tumbling sound
**Example searches**:
- Freesound: https://freesound.org/search/?q=dice+roll
- Mixkit: Search "dice" in game sounds category

### 2. click.mp3 🔘
**Search terms**: "button click", "UI click", "interface click", "soft click"
**Duration**: 0.1-0.3 seconds
**Character**: Short, crisp, satisfying click
**Example searches**:
- Freesound: https://freesound.org/search/?q=button+click
- Mixkit: Search "click" in UI sounds category

### 3. score.mp3 🎯
**Search terms**: "score", "points", "achievement", "collect coin", "positive feedback"
**Duration**: 0.5-1 second
**Character**: Uplifting, rewarding sound
**Example searches**:
- Freesound: https://freesound.org/search/?q=score+point
- Mixkit: Search "coin" or "score" in game sounds

### 4. turn-change.mp3 🔄
**Search terms**: "notification", "alert", "turn", "transition", "whoosh"
**Duration**: 0.5-1 second
**Character**: Neutral, informative transition sound
**Example searches**:
- Freesound: https://freesound.org/search/?q=notification
- Mixkit: Search "notification" in UI sounds

### 5. win.mp3 🏆
**Search terms**: "victory", "win", "success", "fanfare", "celebration"
**Duration**: 2-3 seconds
**Character**: Triumphant, celebratory
**Example searches**:
- Freesound: https://freesound.org/search/?q=victory+fanfare
- Mixkit: Search "success" or "win" in game sounds

## Step-by-Step: Freesound.org

1. **Create Account** (free): https://freesound.org/
2. **Search** for sound using terms above
3. **Filter** results:
   - License: Look for CC0 (Public Domain) for easiest use
   - Duration: < 3 seconds
   - Samplerate: 44100 Hz is standard
4. **Preview** sounds before downloading
5. **Download** in WAV or MP3 format
6. **Convert to MP3** if needed (use online converter like cloudconvert.com)
7. **Optimize** file size (can use Audacity to reduce quality/size if needed)

## Step-by-Step: Mixkit

1. **Visit**: https://mixkit.co/free-sound-effects/
2. **Browse categories**:
   - "Game" for dice, score, win sounds
   - "UI" for clicks and notifications
3. **Click** sound to preview
4. **Download** (no account needed for most sounds)
5. All Mixkit sounds are royalty-free for commercial use

## Alternative: AI-Generated Sounds

You can also use AI tools to generate custom sounds:
- **ElevenLabs Sound Effects**: https://elevenlabs.io/sound-effects (free tier available)
- **Stability Audio**: https://stability.ai/ (if available)

Just describe what you want, e.g., "dice rolling on wooden table"

## Converting/Optimizing Sounds

If you download WAV files, convert them to MP3:

### Using Audacity (Free):
1. Download Audacity: https://www.audacityteam.org/
2. Open WAV file
3. File → Export → Export as MP3
4. Quality: 128 kbps is sufficient for game sounds
5. Save to `public/sounds/`

### Using Online Converter:
1. Visit: https://cloudconvert.com/wav-to-mp3
2. Upload WAV file
3. Download converted MP3
4. Move to `public/sounds/`

## Testing Your Sounds

After adding files to `public/sounds/`:
1. Start your dev server: `npm run dev`
2. Open browser console (F12)
3. Sounds will auto-load on lobby page
4. Check console for any loading errors
5. Toggle sound button and test each interaction

## License Compliance

Always check the license:
- **CC0**: Public domain, use freely
- **CC BY**: Requires attribution (add to README or credits page)
- **CC BY-SA**: Requires attribution and share-alike
- **Freesound specific**: Some require Freesound attribution

### Adding Attribution (if required):
Create `public/sounds/CREDITS.txt`:
```
Sound Effects Credits:

dice-roll.mp3: "Dice Roll" by [Author] (Freesound.org)
License: CC BY 3.0
URL: [link to sound]

[repeat for each sound]
```

## Quick Download Links

Here are some pre-vetted sounds you can use immediately:

### CC0 (Public Domain) - No Attribution Required:
- Search Freesound with filter "License: Creative Commons 0"
- Pixabay Sound Effects: https://pixabay.com/sound-effects/
- Mixkit: All sounds are royalty-free

## Final Checklist

- [ ] Downloaded all 5 sound files
- [ ] Renamed files to exact names (dice-roll.mp3, click.mp3, etc.)
- [ ] Placed in `public/sounds/` directory
- [ ] Checked licenses and added attribution if needed
- [ ] Tested each sound in the game
- [ ] Verified file sizes are reasonable (< 100KB each)
- [ ] Confirmed sound volumes are balanced

## Need Help?

If sounds aren't loading:
1. Check browser console (F12) for errors
2. Verify file names match exactly (case-sensitive)
3. Ensure files are in `public/sounds/` not `src/sounds/`
4. Clear browser cache and reload
5. Try different browser

## Pro Tips

- **Volume Balancing**: Use Audacity to normalize all sounds to same volume
- **Trim Silence**: Remove leading/trailing silence to make sounds more responsive
- **Compression**: Use MP3 at 128kbps for good quality/size balance
- **Format**: MP3 is best for browser compatibility
- **Testing**: Test on both desktop and mobile (mobile may have different volume levels)
