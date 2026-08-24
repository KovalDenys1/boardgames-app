import { readLocal } from '@/lib/safe-storage'
/**
 * Build authentication headers for API requests.
 * Handles both guest (X-Guest-Token) and authenticated user modes.
 */
export function getAuthHeaders(
  isGuest: boolean,
  _guestId?: string | null,
  _guestName?: string | null,
  guestToken?: string | null,
  options?: {
    includeContentType?: boolean
  }
): HeadersInit {
  const includeContentType = options?.includeContentType !== false
  const headers: HeadersInit = includeContentType
    ? { 'Content-Type': 'application/json' }
    : {}

  if (isGuest) {
    const tokenFromStorage = readLocal('boardly_guest_token')
    const effectiveToken = guestToken || tokenFromStorage

    if (effectiveToken) {
      headers['X-Guest-Token'] = effectiveToken
    }
  }

  return headers
}
