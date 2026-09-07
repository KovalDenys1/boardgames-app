/**
 * Measures how well each avatar glyph sits inside its circle.
 *
 * Every avatar is a 100x100 viewBox: a background <circle cx=50 cy=50 r=50>
 * plus the glyph. This unions the getBBox of everything that is not that
 * background and reports the centre offset, so "looks crooked" becomes a
 * number instead of a judgement call.
 *
 *   node scripts/measure-avatars.mjs
 */
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const roots = ['public/avatars/defaults', 'public/avatars/premium']
const files = roots.flatMap((r) =>
  readdirSync(r).filter((f) => f.endsWith('.svg')).map((f) => path.join(r, f))
)

const browser = await chromium.launch()
const page = await browser.newPage()
const rows = []

for (const file of files) {
  const svg = readFileSync(file, 'utf8')
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  const box = await page.evaluate(() => {
    const svg = document.querySelector('svg')
    // Screen coordinates, not getBBox: getBBox reports a shape's own user
    // space and ignores transforms on its ancestors, so a centring <g> would
    // not show up. The svg's own rect maps screen space back onto the viewBox.
    const root = svg.getBoundingClientRect()
    const k = 100 / root.width
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const el of svg.querySelectorAll('*')) {
      if (el.tagName === 'defs' || el.closest('defs')) continue
      if (typeof el.getBBox !== 'function') continue
      if (el.tagName === 'g') continue
      // the background disc: a circle filling the whole viewBox
      if (el.tagName === 'circle' && Number(el.getAttribute('r')) >= 50) continue
      const r = el.getBoundingClientRect()
      if (!r.width && !r.height) continue
      x0 = Math.min(x0, (r.left - root.left) * k)
      y0 = Math.min(y0, (r.top - root.top) * k)
      x1 = Math.max(x1, (r.right - root.left) * k)
      y1 = Math.max(y1, (r.bottom - root.top) * k)
    }
    return { x0, y0, x1, y1 }
  })
  const cx = (box.x0 + box.x1) / 2
  const cy = (box.y0 + box.y1) / 2
  rows.push({
    file: path.basename(file),
    dx: +(cx - 50).toFixed(1),
    dy: +(cy - 50).toFixed(1),
    w: +(box.x1 - box.x0).toFixed(1),
    h: +(box.y1 - box.y0).toFixed(1),
  })
}
await browser.close()

const TOL = 1.5
console.log('file                 dx     dy    size        verdict')
for (const r of rows.sort((a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy))) {
  const off = Math.hypot(r.dx, r.dy)
  console.log(
    `${r.file.padEnd(18)} ${String(r.dx).padStart(5)} ${String(r.dy).padStart(6)}   ${String(r.w).padStart(4)}x${String(r.h).padEnd(5)} ${off > TOL ? 'OFF-CENTRE' : 'ok'}`
  )
}
