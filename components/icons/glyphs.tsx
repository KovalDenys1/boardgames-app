import type { ReactNode, SVGProps } from 'react'
import type { IconName } from './names'

/**
 * The glyphs behind <Icon>. Every shape sits on a 24×24 grid with a 1px
 * safe margin, is drawn in `currentColor` only, and stays legible at 16px.
 *
 * Language (matches the B-tile and the game icons): filled, rounded,
 * slightly chunky. Rings and lines use a 2.4–3.2 stroke with round caps;
 * details are cut out with `fillRule="evenodd"` instead of a second colour.
 * A second layer of the *same* colour at 40% opacity is allowed when it
 * sits beside the main shape (the back card in `cards`), never on top.
 */

function Line(props: SVGProps<SVGPathElement>) {
  return <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props} />
}

function Ring({ r, cx = 12, cy = 12, w = 2.6 }: { r: number; cx?: number; cy?: number; w?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={w} />
}

const face = (
  <>
    <Ring r={9} w={2.5} />
    <circle cx={8.8} cy={10.5} r={1.6} />
    <circle cx={15.2} cy={10.5} r={1.6} />
  </>
)

const speaker = (
  <path d="M5 9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.4l4.8 3.9c.7.5 1.6 0 1.6-.8V5.9c0-.8-.9-1.3-1.6-.8L7.4 9z" />
)

const eyeShape = (
  <Line
    d="M2.5 12c2.5-5 5.7-7.5 9.5-7.5s7 2.5 9.5 7.5c-2.5 5-5.7 7.5-9.5 7.5S5 17 2.5 12z"
    strokeWidth={2.5}
  />
)

const hand = (
  <>
    <rect x={1.5} y={9.5} width={11} height={7} rx={3.5} />
    <rect x={7.5} y={6.5} width={3.4} height={6} rx={1.7} transform="rotate(-30 9.2 9.5)" />
  </>
)

const wing = (
  <path d="M12 6c0-.6.4-1 1-1h.2c2.8 0 5.3-1.5 7-.7 1.3.6 1.4 2.6.5 5-.7 1.9-1.1 2.7 0 3.9 1 1.2 1 3.4-.5 4.9-1.5 1.4-3.6 1.4-5.1.2-1-.8-2.1-1-3.1-.1z" />
)

export const GLYPHS: Record<IconName, ReactNode> = {
  // ── actions & status ────────────────────────────────────────────────
  check: <Line d="M5 12.5l4.5 4.5L19 7.5" strokeWidth={3.2} />,
  close: <Line d="M6.5 6.5l11 11M17.5 6.5l-11 11" strokeWidth={3.2} />,
  plus: <Line d="M12 5v14M5 12h14" strokeWidth={3.2} />,
  minus: <Line d="M5 12h14" strokeWidth={3.2} />,
  'arrow-left': <Line d="M19 12H5.5M11 5.5L4.5 12l6.5 6.5" strokeWidth={3} />,
  'arrow-right': <Line d="M5 12h13.5M13 5.5l6.5 6.5-6.5 6.5" strokeWidth={3} />,
  play: (
    <path d="M8 5.2c0-1.1 1.2-1.8 2.1-1.2l9.6 6.8c.8.6.8 1.8 0 2.4l-9.6 6.8c-.9.6-2.1-.1-2.1-1.2z" />
  ),
  info: (
    <>
      <Ring r={9} />
      <circle cx={12} cy={8} r={1.6} />
      <rect x={10.7} y={10.6} width={2.6} height={6.6} rx={1.3} />
    </>
  ),
  warning: (
    <>
      <Line d="M12 4.2 20.8 19.3H3.2z" strokeWidth={2.6} />
      <rect x={10.8} y={9} width={2.4} height={5} rx={1.2} />
      <circle cx={12} cy={16.3} r={1.4} />
    </>
  ),
  question: (
    <>
      <Ring r={9} />
      <Line d="M9.3 9.6a2.8 2.8 0 1 1 4 2.5c-.9.5-1.3 1-1.3 2" strokeWidth={2.4} />
      <circle cx={12} cy={17} r={1.4} />
    </>
  ),
  search: (
    <>
      <Ring r={6.5} cx={10.5} cy={10.5} w={2.8} />
      <Line d="M15.5 15.5 20.5 20.5" strokeWidth={3.2} />
    </>
  ),
  copy: (
    <>
      <rect x={8} y={8} width={12} height={12} rx={2.5} fill="none" stroke="currentColor" strokeWidth={2.4} />
      <Line d="M16 7V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H7" strokeWidth={2.4} />
    </>
  ),
  clipboard: (
    <>
      <rect x={5} y={5} width={14} height={16} rx={2.5} fill="none" stroke="currentColor" strokeWidth={2.4} />
      <rect x={8.5} y={3} width={7} height={4} rx={1.5} />
      <Line d="M8.5 12h7M8.5 16h5" strokeWidth={2.2} />
    </>
  ),
  link: (
    <Line
      d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"
      strokeWidth={2.5}
    />
  ),
  mail: (
    <>
      <rect x={3} y={5.5} width={18} height={13} rx={2.5} fill="none" stroke="currentColor" strokeWidth={2.4} />
      <Line d="M4 7.5l8 6 8-6" strokeWidth={2.4} />
    </>
  ),

  // ── visibility & sound ──────────────────────────────────────────────
  eye: (
    <>
      {eyeShape}
      <circle cx={12} cy={12} r={3.2} />
    </>
  ),
  'eye-off': (
    <>
      {eyeShape}
      <circle cx={12} cy={12} r={3.2} />
      <Line d="M4 4l16 16" strokeWidth={2.6} />
    </>
  ),
  'sound-on': (
    <>
      {speaker}
      <Line d="M16 9.5a3.8 3.8 0 0 1 0 5M18.6 7a7.2 7.2 0 0 1 0 10" strokeWidth={2.4} />
    </>
  ),
  'sound-off': (
    <>
      {speaker}
      <Line d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" strokeWidth={2.6} />
    </>
  ),

  // ── people & rank ───────────────────────────────────────────────────
  user: (
    <>
      <circle cx={12} cy={8} r={4.2} />
      <path d="M4 20.2c0-4.3 3.6-7.2 8-7.2s8 2.9 8 7.2c0 .4-.4.8-.8.8H4.8c-.4 0-.8-.4-.8-.8z" />
    </>
  ),
  users: (
    <>
      <circle cx={9} cy={8} r={3.6} />
      <circle cx={16.5} cy={9} r={2.9} />
      <path d="M2.5 19.3c0-3.7 2.9-6.3 6.5-6.3s6.5 2.6 6.5 6.3c0 .4-.3.7-.7.7H3.2c-.4 0-.7-.3-.7-.7z" />
      <path d="M16.9 20c.1-.2.1-.5.1-.7 0-2.3-.9-4.3-2.4-5.8.6-.3 1.2-.5 1.9-.5 2.9 0 5 2.1 5 5.2 0 .5-.4.8-.8.8z" />
    </>
  ),
  crown: (
    <path d="M4 8.5a.8.8 0 0 1 1.3-.6L9 11l2.4-5.2a.7.7 0 0 1 1.2 0L15 11l3.7-3.1a.8.8 0 0 1 1.3.6L18.6 18a1 1 0 0 1-1 .9H6.4a1 1 0 0 1-1-.9z" />
  ),
  star: (
    <path
      d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9L3.4 9.4l6-.7z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  ),
  sparkle: (
    <>
      <path d="M12 2.5c.6 4.7 2.8 6.9 7.5 7.5-4.7.6-6.9 2.8-7.5 7.5-.6-4.7-2.8-6.9-7.5-7.5 4.7-.6 6.9-2.8 7.5-7.5z" />
      <circle cx={18.5} cy={18.5} r={2} />
    </>
  ),
  heart: (
    <path d="M12 20.5c-.4 0-.7-.1-1-.4L4.6 14C2.3 11.7 2.3 8 4.6 5.7a5.1 5.1 0 0 1 7.4.3 5.1 5.1 0 0 1 7.4-.3c2.3 2.3 2.3 6 0 8.3L13 20.1c-.3.3-.6.4-1 .4z" />
  ),
  lock: (
    <>
      <rect x={4.5} y={10.5} width={15} height={10.5} rx={3} />
      <Line d="M8 10.5V8a4 4 0 0 1 8 0v2.5" strokeWidth={2.6} />
    </>
  ),
  shield: (
    <>
      <Line d="M12 3l7.5 2.8v5.6c0 4.5-3.2 8.2-7.5 9.6-4.3-1.4-7.5-5.1-7.5-9.6V5.8z" strokeWidth={2.5} />
      <Line d="M8.7 12.2l2.3 2.3 4.3-4.6" strokeWidth={2.6} />
    </>
  ),
  trophy: (
    <>
      <path d="M7 3.5h10v6a5 5 0 0 1-10 0z" />
      <Line d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" strokeWidth={2.2} />
      <rect x={10.6} y={13.5} width={2.8} height={4} />
      <rect x={7} y={17} width={10} height={3.5} rx={1.5} />
    </>
  ),
  medal: (
    <>
      <path d="M7.5 3h3.5l2 5.5-4 1.5z" />
      <path d="M16.5 3H13l-2 5.5 4 1.5z" />
      <circle cx={12} cy={15} r={5.8} />
    </>
  ),
  flame: (
    <path d="M12 2.8c.5 3.2 2.3 4.6 3.9 6.2 1.8 1.8 2.6 3.5 2.6 5.5A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-6.5c0-2.5 1.2-4.4 2.9-6.1-.2 1.9.5 3 1.7 3.4-.3-3.5.8-6.3 1.9-9z" />
  ),
  bolt: (
    <path d="M13.2 2.6c.4-.5 1.2-.2 1.1.5L13.2 10h5.3c.6 0 .9.7.5 1.1l-8.2 10.3c-.4.5-1.2.2-1.1-.5L10.8 14H5.5c-.6 0-.9-.7-.5-1.1z" />
  ),
  gem: (
    <path d="M7 3.5h10c.3 0 .6.2.8.4l3.6 4.6c.3.4.3.9 0 1.3l-8.6 10.5c-.4.5-1.2.5-1.6 0L2.6 9.8c-.3-.4-.3-.9 0-1.3l3.6-4.6c.2-.2.5-.4.8-.4z" />
  ),

  // ── play ────────────────────────────────────────────────────────────
  gamepad: (
    <path
      fillRule="evenodd"
      d="M7 7h10a5.5 5.5 0 0 1 5.5 5.5v1A5.5 5.5 0 0 1 17 19h-.4a3 3 0 0 1-2.1-.9L13.2 17h-2.4l-1.3 1.1A3 3 0 0 1 7.4 19H7a5.5 5.5 0 0 1-5.5-5.5v-1A5.5 5.5 0 0 1 7 7zm-.4 3.8v1.4H5.2v1.6h1.4v1.4h1.6v-1.4h1.4v-1.6H8.2v-1.4zm9.4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm2.5 2.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"
    />
  ),
  dice: (
    <path
      fillRule="evenodd"
      d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm1 4.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm8 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm-4 3.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm-4 3.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm8 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"
    />
  ),
  cards: (
    <>
      <rect x={4} y={5.5} width={10} height={14} rx={2} transform="rotate(-12 9 12.5)" opacity={0.4} />
      <rect x={9.5} y={5} width={10.5} height={14.5} rx={2} transform="rotate(8 14.75 12.25)" />
    </>
  ),
  mask: (
    <path
      fillRule="evenodd"
      d="M3.5 5.5c2.6 1 5.4 1.5 8.5 1.5s5.9-.5 8.5-1.5c.5 4.9-.2 9-2.3 11.8-1.6 2.1-3.7 3.4-6.2 3.7-2.5-.3-4.6-1.6-6.2-3.7C3.7 14.5 3 10.4 3.5 5.5zM8 10a1.8 1.3 0 1 0 0 2.6A1.8 1.3 0 0 0 8 10zm8 0a1.8 1.3 0 1 0 0 2.6 1.8 1.3 0 0 0 0-2.6zM8.6 15.2c.9 1.1 2 1.7 3.4 1.7s2.5-.6 3.4-1.7c-1.1.4-2.2.6-3.4.6s-2.3-.2-3.4-.6z"
    />
  ),
  target: (
    <>
      <Ring r={9} />
      <Ring r={5} w={2.4} />
      <circle cx={12} cy={12} r={1.9} />
    </>
  ),
  hourglass: (
    <path d="M6.5 3h11a1 1 0 0 1 1 1v2.2c0 .5-.2 1-.5 1.4L14.4 12l3.6 4.4c.3.4.5.9.5 1.4V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-2.2c0-.5.2-1 .5-1.4L9.6 12 6 7.6a2.2 2.2 0 0 1-.5-1.4V4a1 1 0 0 1 1-1z" />
  ),
  clock: (
    <>
      <Ring r={9} />
      <Line d="M12 7.5V12l3 2.2" strokeWidth={2.6} />
    </>
  ),
  rock: (
    <path
      d="M8.5 5.5l5.5-1.8 5.2 3.2 1.5 5.6-2.4 5.6-5.6 1.7-5.8-1.4L3.5 13l1.2-5z"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinejoin="round"
    />
  ),
  paper: (
    <path
      fillRule="evenodd"
      d="M6.5 2.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5zm6.5 2v3.5h3.5z"
    />
  ),
  scissors: (
    <>
      <Ring r={3} cx={7} cy={7} w={2.5} />
      <Ring r={3} cx={7} cy={17} w={2.5} />
      <Line d="M9.3 8.9L20.5 19M9.3 15.1L20.5 5" strokeWidth={2.7} />
    </>
  ),

  // ── bots ────────────────────────────────────────────────────────────
  robot: (
    <>
      <path
        fillRule="evenodd"
        d="M12 2.5a1.5 1.5 0 0 1 1.5 1.5c0 .6-.4 1.2-.9 1.4v1.1h3.9A3.5 3.5 0 0 1 20 10v6.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5V10a3.5 3.5 0 0 1 3.5-3.5h3.9V5.4A1.5 1.5 0 0 1 12 2.5zM8.8 10.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm6.4 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM9 16v1.6h6V16z"
      />
      <rect x={1.5} y={11} width={2} height={4} rx={1} />
      <rect x={20.5} y={11} width={2} height={4} rx={1} />
    </>
  ),
  'bot-easy': (
    <>
      {face}
      <Line d="M8.3 14.2c.9 1.6 2.1 2.4 3.7 2.4s2.8-.8 3.7-2.4" strokeWidth={2.4} />
    </>
  ),
  'bot-medium': (
    <>
      {face}
      <Line d="M8.5 15.3h7" strokeWidth={2.4} />
    </>
  ),
  'bot-hard': (
    <>
      {face}
      <Line d="M6.8 7.4l3.6 1.6M17.2 7.4l-3.6 1.6" strokeWidth={2.2} />
      <Line d="M8.3 16.8c.9-1.6 2.1-2.4 3.7-2.4s2.8.8 3.7 2.4" strokeWidth={2.4} />
    </>
  ),

  // ── places & things ─────────────────────────────────────────────────
  home: (
    <path
      fillRule="evenodd"
      d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.3c.7.6.2 1.7-.7 1.7H19v7.2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-7.2H4c-.9 0-1.4-1.1-.7-1.7zM10 14v5h4v-5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1z"
    />
  ),
  map: (
    <path
      fillRule="evenodd"
      d="M3 6.2c0-.7.7-1.2 1.4-1L9 6.5l6-2 5.3 1.4c.4.1.7.5.7 1v11c0 .7-.7 1.2-1.4 1L15 17.5l-6 2-5.3-1.4a1 1 0 0 1-.7-1zM9 8.6v8.9l6-2V6.6z"
    />
  ),
  globe: (
    <>
      <Ring r={9} w={2.5} />
      <ellipse cx={12} cy={12} rx={3.8} ry={9} fill="none" stroke="currentColor" strokeWidth={2.2} />
      <Line d="M3.5 12h17" strokeWidth={2.2} />
    </>
  ),
  laptop: (
    <>
      <rect x={4} y={4.5} width={16} height={11} rx={2} fill="none" stroke="currentColor" strokeWidth={2.4} />
      <path d="M2 17.5h20v.7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    </>
  ),
  rocket: (
    <>
      <path
        fillRule="evenodd"
        d="M12 2.5c3 2 4.5 5.4 4.5 9.5v3.4l2.3 2.6c.4.4.4 1 .1 1.5l-.5.9c-.3.5-1 .6-1.4.2L14.6 18H9.4l-2.4 2.6c-.4.4-1.1.3-1.4-.2l-.5-.9a1.1 1.1 0 0 1 .1-1.5L7.5 15.4V12c0-4.1 1.5-7.5 4.5-9.5zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
      />
      <path d="M10 19.5h4l-.6 2.2a1.5 1.5 0 0 1-2.8 0z" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8v.5h6v-.5c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5z" />
      <rect x={9} y={17.8} width={6} height={2.2} rx={1} />
      <rect x={10} y={20.6} width={4} height={1.6} rx={0.8} />
    </>
  ),
  pencil: (
    <path
      fillRule="evenodd"
      d="M15.2 3.6a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 1 0 2.8L9.7 19.5 4 20.8c-.5.1-.9-.3-.8-.8l1.3-5.7zm-1.9 3.3 3.8 3.8 1.2-1.2-3.8-3.8z"
    />
  ),
  chart: (
    <>
      <rect x={4} y={13} width={4} height={7} rx={1.2} />
      <rect x={10} y={8} width={4} height={12} rx={1.2} />
      <rect x={16} y={4} width={4} height={16} rx={1.2} />
    </>
  ),
  tag: (
    <path
      fillRule="evenodd"
      d="M3 4.5A1.5 1.5 0 0 1 4.5 3h6.3c.4 0 .8.2 1 .4l8.7 8.7a1.5 1.5 0 0 1 0 2.1l-6.3 6.3a1.5 1.5 0 0 1-2.1 0L3.4 11.8a1.5 1.5 0 0 1-.4-1zM8 6.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"
    />
  ),
  party: (
    <>
      <path d="M4.2 20.6c-.6.2-1.1-.3-.9-.9l3.9-10.3c.2-.6 1-.8 1.5-.3l6 6c.5.5.3 1.3-.3 1.5z" />
      <Line d="M14.5 6.5c1.5-.5 2.5-1.7 2.8-3.5M17.5 9.5c1.3-1 2.8-1.2 4-.7" strokeWidth={2.2} />
      <circle cx={13.5} cy={3.3} r={1.5} />
      <circle cx={20.5} cy={5.2} r={1.4} />
      <circle cx={19.7} cy={13.2} r={1.5} />
    </>
  ),
  butterfly: (
    <>
      {wing}
      <g transform="matrix(-1 0 0 1 24 0)">{wing}</g>
      <rect x={11} y={5} width={2} height={13} rx={1} />
      <Line d="M11 5.5 9.5 3M13 5.5l1.5-2.5" strokeWidth={1.6} />
    </>
  ),
  handshake: (
    <>
      {hand}
      <g transform="matrix(-1 0 0 1 24 0)">{hand}</g>
      <rect x={9.5} y={9.5} width={5} height={7} rx={1.6} />
    </>
  ),
}
