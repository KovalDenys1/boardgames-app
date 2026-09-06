import type { CSSProperties, ReactNode, SVGProps } from 'react'

/**
 * Game icons – one glyph per game on a 48×48 grid, in the same language as
 * the chrome icons (components/icons) and the B-tile brand mark: filled,
 * rounded, chunky. Two colours only: the main shape in `currentColor` and
 * details (pips, eyes, teeth) in `--gi-detail`, which GameIcon sets per
 * variant so the same glyph works tinted, bare, or as an ink-on-accent
 * sticker. Never a hex value here – dark mode and the premium lobby
 * themes swap the tokens underneath.
 *
 * Adding a game: add its glyph under the catalog `id` (= `svgId`), keep
 * inside the 4px safe margin, check it on /dev/icons at 24 / 40 / 72.
 */

const D: CSSProperties = { fill: 'var(--gi-detail)' }
const DS: CSSProperties = { stroke: 'var(--gi-detail)', fill: 'none' }

function Line(props: SVGProps<SVGPathElement>) {
  return <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props} />
}

export const GAME_GLYPHS: Record<string, ReactNode> = {
  yahtzee: (
    <>
      <rect x={5} y={7} width={20} height={20} rx={6} transform="rotate(-14 15 17)" opacity={0.45} />
      <rect x={15} y={13} width={27} height={27} rx={7.5} />
      <circle cx={22} cy={20} r={2.7} style={D} />
      <circle cx={35} cy={20} r={2.7} style={D} />
      <circle cx={28.5} cy={26.5} r={2.7} style={D} />
      <circle cx={22} cy={33} r={2.7} style={D} />
      <circle cx={35} cy={33} r={2.7} style={D} />
    </>
  ),
  spy: (
    <>
      <circle cx={24} cy={31} r={11.5} />
      <rect x={13} y={7} width={22} height={13} rx={4.5} />
      <rect x={6} y={18} width={36} height={5.5} rx={2.75} />
      <rect x={14} y={27.5} width={20} height={5} rx={2.5} style={D} />
      <rect x={22} y={27.5} width={4} height={5} />
    </>
  ),
  'tic-tac-toe': (
    <>
      <rect x={17.5} y={5} width={4.5} height={38} rx={2.25} />
      <rect x={26} y={5} width={4.5} height={38} rx={2.25} />
      <rect x={5} y={17.5} width={38} height={4.5} rx={2.25} />
      <rect x={5} y={26} width={38} height={4.5} rx={2.25} />
      <path d="M8.5 8.5l6 6M14.5 8.5l-6 6" strokeWidth={3} strokeLinecap="round" style={DS} />
      <circle cx={24} cy={24} r={3.6} strokeWidth={3} style={DS} />
      <path d="M33.5 33.5l6 6M39.5 33.5l-6 6" strokeWidth={3} strokeLinecap="round" style={DS} />
    </>
  ),
  memory: (
    <>
      <rect x={7} y={6} width={22} height={30} rx={5} transform="rotate(-12 18 21)" opacity={0.45} />
      <rect x={18} y={12} width={23} height={30} rx={5} />
      <rect x={25.5} y={23} width={8} height={8} rx={1.6} transform="rotate(45 29.5 27)" style={D} />
    </>
  ),
  rps: (
    <>
      <circle cx={14} cy={34} r={6} fill="none" stroke="currentColor" strokeWidth={4.5} />
      <circle cx={34} cy={34} r={6} fill="none" stroke="currentColor" strokeWidth={4.5} />
      <Line d="M17.5 29.5L32 7M30.5 29.5L16 7" strokeWidth={5.5} />
      <circle cx={24} cy={19.5} r={2.6} style={D} />
    </>
  ),
  'connect-four': (
    <>
      <circle cx={24} cy={7} r={4.5} />
      <rect x={6} y={12} width={36} height={28} rx={6} />
      <rect x={9} y={39} width={7} height={4} rx={1.5} />
      <rect x={32} y={39} width={7} height={4} rx={1.5} />
      {[14, 24, 34].map((cx) =>
        [19.5, 27, 34.5].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.3} style={D} />)
      )}
    </>
  ),
  'guess-my-drawing': (
    <g transform="rotate(45 24 24)">
      <rect x={19.5} y={4} width={9} height={5} rx={2} />
      <rect x={19.5} y={10} width={9} height={22} />
      <rect x={19.5} y={13} width={9} height={3} style={D} />
      <path d="M19.5 32h9l-4.5 10z" />
      <path d="M22.4 38.4h3.2L24 42z" style={D} />
    </g>
  ),
  'fake-artist': (
    <>
      <path d="M24 8c11 0 19 7 19 15.5 0 3.5-2.5 6.5-6 6.5h-3.5c-2 0-3 1.5-2.3 3.3.8 2.2-.2 4.7-2.7 5.3-1.5.3-3 .4-4.5.4C13 39 5 32 5 23.5S13 8 24 8z" />
      <circle cx={14.5} cy={22} r={3.3} style={D} />
      <circle cx={21} cy={15.5} r={3.3} style={D} />
      <circle cx={30.5} cy={15.5} r={3.3} style={D} />
      <circle cx={36} cy={22} r={3.3} style={D} />
    </>
  ),
  'telephone-doodle': (
    <>
      <rect x={6} y={7} width={12} height={15} rx={5.5} />
      <rect x={30} y={26} width={12} height={15} rx={5.5} />
      <Line d="M12 20Q12 33.5 30 33.5" strokeWidth={6} />
      <circle cx={12} cy={13} r={2.4} style={D} />
      <circle cx={36} cy={35} r={2.4} style={D} />
    </>
  ),
  'words-mines': (
    <>
      <circle cx={21} cy={29} r={14} />
      <rect x={26} y={12} width={8} height={6} rx={2} transform="rotate(-40 30 15)" />
      <Line d="M33 13.5c1.5-3.5 4.5-5 8-4" strokeWidth={3.5} />
      <path d="M41.5 4.5l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" />
      <circle cx={15.5} cy={24} r={3} style={D} />
    </>
  ),
  anagrams: (
    <>
      <rect x={4} y={22} width={12.5} height={12.5} rx={3} />
      <rect x={17.75} y={13} width={12.5} height={12.5} rx={3} />
      <rect x={31.5} y={22} width={12.5} height={12.5} rx={3} />
      <rect x={17.75} y={27} width={12.5} height={12.5} rx={3} opacity={0.45} />
      <circle cx={10.25} cy={28.25} r={2.6} style={D} />
      <rect x={21.5} y={16.75} width={5} height={5} rx={1} style={D} />
      <path d="M37.75 25l3.2 5.5h-6.4z" style={D} />
      <Line d="M14 10.5c3-4 7-5.5 12-4.5" strokeWidth={3} />
      <path d="M27.5 3.5l3 3.8-4.8.6z" />
    </>
  ),
  crocodile: (
    <>
      <rect x={4} y={14} width={40} height={11} rx={5.5} />
      <circle cx={13} cy={12.5} r={5.5} />
      <circle cx={13.5} cy={12} r={2.2} style={D} />
      <rect x={9} y={30} width={35} height={8} rx={4} />
      {[19, 25, 31, 37].map((x) => (
        <path key={x} d={`M${x} 25h5l-2.5 4.5z`} style={D} />
      ))}
    </>
  ),
  alias: (
    <>
      <path d="M12 6h24a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7H23l-9 8v-8h-2a7 7 0 0 1-7-7V13a7 7 0 0 1 7-7z" />
      <rect x={13} y={15} width={22} height={4} rx={2} style={D} />
      <rect x={13} y={22} width={15} height={4} rx={2} style={D} />
    </>
  ),
  'liars-party': (
    <>
      <rect x={9} y={9} width={20} height={28} rx={4} transform="rotate(-14 19 23)" opacity={0.45} />
      <rect x={19} y={11} width={20} height={28} rx={4} transform="rotate(10 29 25)" />
      <path
        d="M29 18c2.6 0 4.4 2 4.4 4.3 0 3.3-4.4 6.5-4.4 6.5s-4.4-3.2-4.4-6.5C24.6 20 26.4 18 29 18z"
        transform="rotate(10 29 25)"
        style={D}
      />
      <circle cx={23} cy={16} r={1.8} transform="rotate(10 29 25)" style={D} />
      <circle cx={35} cy={34} r={1.8} transform="rotate(10 29 25)" style={D} />
    </>
  ),
  'alibi-night': (
    <>
      <circle cx={20} cy={20} r={12} fill="none" stroke="currentColor" strokeWidth={5.5} />
      <Line d="M29 29l11.5 11.5" strokeWidth={6.5} />
      <circle cx={20} cy={20} r={3.2} style={D} />
      <path d="M38 5.5c-.8 3.3.9 6.3 4 7.3-3 1.4-4.9 4-4.8 7-2.1-2.3-5.3-3-8.1-1.7 1.5-2.7 1.1-6.1-1.1-8.4 3.4.6 6.8-1 8-4.2 0 0 2 0 2 0z" />
    </>
  ),
}

export const GAME_ICON_IDS = Object.keys(GAME_GLYPHS)

export type GameIconVariant = 'tile' | 'bare' | 'sticker'

interface GameGlyphProps {
  gameId: string
  size: number
  color: string
  detailColor: string
  label?: string
  className?: string
  style?: CSSProperties
}

/** The bare svg – use through GameIcon unless you are building a new frame. */
export function GameGlyph({ gameId, size, color, detailColor, label, className, style }: GameGlyphProps) {
  const glyph = GAME_GLYPHS[gameId] ?? GAME_GLYPHS.yahtzee
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="currentColor"
      data-game-icon={gameId}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0, color, ['--gi-detail' as string]: detailColor, ...style } as CSSProperties}
    >
      {glyph}
    </svg>
  )
}

interface GameIconProps {
  gameId: string
  /** A token: 'var(--bd-sky)'. Tile/bare colour the glyph with it; sticker uses it as the tile fill. */
  accentColor: string
  /** Glyph size in px. The tile/sticker frame adds 24px around it. */
  size?: number
  variant?: GameIconVariant
  /** Override the detail colour (defaults to ink, or the accent inside a sticker). */
  detailColor?: string
  label?: string
  className?: string
}

export default function GameIcon({
  gameId,
  accentColor,
  size = 40,
  variant = 'tile',
  detailColor,
  label,
  className,
}: GameIconProps) {
  if (variant === 'bare') {
    return (
      <GameGlyph
        gameId={gameId}
        size={size}
        color={accentColor}
        detailColor={detailColor ?? 'var(--bd-ink)'}
        label={label}
        className={className}
      />
    )
  }

  const box = size + 24

  if (variant === 'sticker') {
    const lift = Math.max(3, Math.round(box * 0.06))
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: box,
          height: box,
          borderRadius: Math.round(box * 0.27),
          background: accentColor,
          border: '2.5px solid var(--bd-ink)',
          boxShadow: `${lift}px ${lift}px 0 var(--bd-ink)`,
          transform: 'rotate(-6deg)',
        }}
      >
        <GameGlyph
          gameId={gameId}
          size={size}
          color="var(--bd-ink)"
          detailColor={detailColor ?? accentColor}
          label={label}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-2xl ${className ?? ''}`}
      style={{
        width: box,
        height: box,
        background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
      }}
    >
      <GameGlyph
        gameId={gameId}
        size={size}
        color={accentColor}
        detailColor={detailColor ?? 'var(--bd-ink)'}
        label={label}
      />
    </div>
  )
}
