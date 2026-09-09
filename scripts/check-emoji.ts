import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import path from 'path'

/**
 * Emoji audit — keeps OS emoji out of the UI (DESIGN.md "Icons").
 *
 * Boardly draws its own icons (components/icons, components/GameIcon). Unicode
 * emoji render in the platform's emoji font, ignore the design tokens, and read
 * as generic — so any emoji in app/, components/, lib/, locales/, hooks/,
 * contexts/ fails this audit unless:
 *   - the file is in scripts/emoji-allowlist.json (user content: chat,
 *     reactions, celebration bursts, memory card faces; server-only text), or
 *   - the line is a log call (console.*, clientLogger.*, logger.*), or
 *   - the line (or the line above) carries a comment `emoji-allow: reason`.
 *
 * Legacy debt lives in scripts/emoji-baseline.json as a ratchet, exactly like
 * audit-responsive: a file NOT in the baseline fails; a baseline count that
 * exceeds reality fails (shrink it in the PR that removes the emoji).
 * Regenerate after a migration PR: npx tsx scripts/check-emoji.ts --update-baseline
 */

type BaselineEntry = { file: string; count: number }
type Allowlist = { files: Record<string, string> }

const repoRoot = process.cwd()
const scanRoots = ['app', 'components', 'lib', 'locales', 'hooks', 'contexts']
const sourceExtensions = new Set(['.ts', '.tsx'])
const ignoredDirectories = new Set(['node_modules', '.next', '.git', 'coverage', 'reports'])
const baselinePath = path.join(repoRoot, 'scripts', 'emoji-baseline.json')
const allowlistPath = path.join(repoRoot, 'scripts', 'emoji-allowlist.json')
const updateBaseline = process.argv.includes('--update-baseline')

// Pictographs, the dingbat/misc-symbol blocks (✓ ✕ ⚠ ⚀–⚅ ★ …), the supplemental
// symbol planes, and the emoji variation selector. © ® ™ are typographic, not emoji.
const emojiPattern = /(?![©®™])(?:\p{Extended_Pictographic}|[☀-➿⬀-⯿]|[\u{1F000}-\u{1FAFF}]|️)/u
const logLinePattern = /\b(?:console|clientLogger|logger|log)\.(?:log|info|warn|error|debug|trace)\(/
const optOutPattern = /emoji-allow(?:\([^)]*\))?:/

function toPosixPath(value: string) {
  return value.split(path.sep).join('/')
}

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirectories.has(entry)) continue
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (sourceExtensions.has(path.extname(entry))) out.push(full)
  }
}

function countEmojiLines(file: string): { count: number; samples: string[] } {
  const lines = readFileSync(file, 'utf8').split('\n')
  let count = 0
  const samples: string[] = []
  lines.forEach((line, index) => {
    if (!emojiPattern.test(line)) return
    if (logLinePattern.test(line)) return
    if (optOutPattern.test(line) || (index > 0 && optOutPattern.test(lines[index - 1]))) return
    count += 1
    if (samples.length < 3) samples.push(`${index + 1}: ${line.trim().slice(0, 90)}`)
  })
  return { count, samples }
}

const allowlist: Allowlist = existsSync(allowlistPath)
  ? JSON.parse(readFileSync(allowlistPath, 'utf8'))
  : { files: {} }
const baseline: BaselineEntry[] = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : []
const baselineByFile = new Map(baseline.map((entry) => [entry.file, entry.count]))

const files: string[] = []
for (const root of scanRoots) {
  const full = path.join(repoRoot, root)
  if (existsSync(full)) walk(full, files)
}

const results = files
  .map((file) => ({ file: toPosixPath(path.relative(repoRoot, file)), ...countEmojiLines(file) }))
  .filter((entry) => entry.count > 0 && !(entry.file in allowlist.files))
  .sort((a, b) => a.file.localeCompare(b.file))

if (updateBaseline) {
  writeFileSync(baselinePath, JSON.stringify(results.map(({ file, count }) => ({ file, count })), null, 2) + '\n')
  console.log(`emoji baseline written: ${results.length} files, ${results.reduce((n, r) => n + r.count, 0)} lines`)
  process.exit(0)
}

const failures: string[] = []
for (const entry of results) {
  const allowed = baselineByFile.get(entry.file)
  if (allowed === undefined) {
    failures.push(`NEW  ${entry.file} (${entry.count} line${entry.count === 1 ? '' : 's'})\n      ${entry.samples.join('\n      ')}`)
  } else if (entry.count > allowed) {
    failures.push(`GREW ${entry.file}: ${entry.count} > baseline ${allowed}\n      ${entry.samples.join('\n      ')}`)
  }
}
for (const [file, count] of baselineByFile) {
  const actual = results.find((entry) => entry.file === file)?.count ?? 0
  if (actual < count) failures.push(`STALE ${file}: baseline ${count} but found ${actual} — shrink scripts/emoji-baseline.json`)
}

if (failures.length > 0) {
  console.error('Emoji audit failed. Use <Icon> / <GameIcon> (components/icons, DESIGN.md "Icons") instead of emoji.\n')
  console.error(failures.join('\n\n'))
  process.exit(1)
}

const remaining = results.reduce((n, r) => n + r.count, 0)
console.log(`emoji audit ok — ${results.length} legacy files / ${remaining} lines still in baseline`)
