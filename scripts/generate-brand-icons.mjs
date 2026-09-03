// Regenerates every raster brand asset from assets/brand/*.svg (issue #789).
// Run: node scripts/generate-brand-icons.mjs
import sharp from 'sharp'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const PAPER = '#FBF6EE'
const tile = await readFile('assets/brand/tile.svg')
const logo = await readFile('assets/brand/logo.svg')

// Maskable icons need the mark inside the ~80% safe zone on an opaque ground.
const maskable = (size) =>
  sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
    .composite([{ input: tileAt(Math.round(size * 0.72)), gravity: 'center' }])
    .png()

const tileCache = new Map()
function tileAt(size) {
  if (!tileCache.has(size)) tileCache.set(size, sharp(tile).resize(size, size).png())
  return tileCache.get(size)
}

async function render(pipeline, out) {
  const buf = await (pipeline.toBuffer ? pipeline.toBuffer() : pipeline)
  await writeFile(out, buf)
  console.log('wrote', out)
}

await mkdir('public/brand', { recursive: true })

// Transparent tile icons (favicons / manifest "any")
for (const size of [192, 512]) {
  await render(sharp(tile).resize(size, size).png(), `public/icons/icon-${size}.png`)
}
// Maskable icons (opaque paper ground, safe-zone padding)
for (const size of [192, 512]) {
  const inner = await sharp(tile).resize(Math.round(size * 0.72)).png().toBuffer()
  await render(
    sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
      .composite([{ input: inner, gravity: 'center' }])
      .png(),
    `public/icons/icon-maskable-${size}.png`
  )
}
// Apple touch icon: 180px, opaque ground (iOS shows black behind transparency)
{
  const inner = await sharp(tile).resize(160).png().toBuffer()
  await render(
    sharp({ create: { width: 180, height: 180, channels: 4, background: PAPER } })
      .composite([{ input: inner, gravity: 'center' }])
      .png(),
    'public/icons/apple-touch-icon.png'
  )
}
// Stripe branding assets
await render(sharp(tile).resize(512, 512).png(), 'public/brand/icon.png')
{
  const inner = await sharp(logo).resize({ width: 1024 }).png().toBuffer()
  await render(
    sharp({ create: { width: 1120, height: 320, channels: 4, background: PAPER } })
      .composite([{ input: inner, gravity: 'center' }])
      .png(),
    'public/brand/logo.png'
  )
}
