/**
 * Leave/logout icon: door frame + arrow pointing out. Inherits currentColor,
 * so it follows the button's text color (incl. hover states).
 */
export default function LeaveIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M10 13H4.5C3.94772 13 3.5 12.5523 3.5 12V4C3.5 3.44772 3.94772 3 4.5 3H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 8H13.5M13.5 8L11 5.5M13.5 8L11 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
