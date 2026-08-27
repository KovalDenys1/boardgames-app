'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useGuest } from '@/contexts/GuestContext'
import { fetchWithGuest } from '@/lib/fetch-with-guest'
import type { ChatMessagePayload, PlayerTypingPayload } from '@/types/game'

/**
 * Shared lobby chat state (#736 phase 1) — extracted from LobbyPageClient so
 * the dedicated game pages (TTT, C4) can use the same Redis-backed,
 * server-authorized chat pipeline instead of hand-rolling client-side
 * broadcasts (which bypassed persistence/authz and sent id-less payloads).
 *
 * Split in two because of call-order: `useLobbyChat` produces the
 * `onChatMessage`/`onPlayerTyping` handlers that `useRealtimeConnection`
 * needs, while `useLobbyChatHistory` needs the `isConnected` flag that
 * `useRealtimeConnection` returns. Call them around it:
 *
 *   const chat = useLobbyChat({ code, isChatVisible })
 *   const { isConnected, isReconnecting } = useRealtimeConnection({
 *     onChatMessage: chat.onChatMessage,
 *     onPlayerTyping: chat.onPlayerTyping, ...
 *   })
 *   useLobbyChatHistory({ code, isConnected, isReconnecting, mergeHistoryMessages: chat.mergeHistoryMessages })
 */

interface UseLobbyChatOptions {
  code: string
  /** Whether the chat UI is currently on screen — suppresses unread counting. */
  isChatVisible: boolean
  /** Optional ambient sound hook for incoming messages. */
  onIncomingMessageSound?: () => void
}

export function useLobbyChat({ code, isChatVisible, onIncomingMessageSound }: UseLobbyChatOptions) {
  const { data: session } = useSession()
  const { isGuest, guestId, guestName } = useGuest()

  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [someoneTyping, setSomeoneTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Read via refs so the realtime handlers stay referentially stable and
  // never force useRealtimeConnection to re-subscribe.
  const isChatVisibleRef = useRef(isChatVisible)
  isChatVisibleRef.current = isChatVisible
  const currentUserIdRef = useRef<string | null | undefined>(undefined)
  currentUserIdRef.current = isGuest ? guestId : session?.user?.id
  const soundRef = useRef(onIncomingMessageSound)
  soundRef.current = onIncomingMessageSound

  const onChatMessage = useCallback((message: ChatMessagePayload) => {
    setChatMessages(prev => {
      // Remove the matching optimistic entry added by sendChatMessage
      const filtered = prev.filter(m => {
        if (typeof m.id !== 'string' || !m.id.startsWith('temp-')) return true
        const age = Date.now() - parseInt(m.id.slice(5), 10)
        return !(m.userId === message.userId && m.message === message.message && age < 5000)
      })
      return [...filtered, message]
    })
    const isOwnMessage = message.userId === currentUserIdRef.current
    if (!isChatVisibleRef.current && !isOwnMessage) {
      setUnreadCount(prev => prev + 1)
    }
    if (!isOwnMessage) {
      soundRef.current?.()
    }
  }, [])

  const onPlayerTyping = useCallback((data: PlayerTypingPayload) => {
    if (data.userId === currentUserIdRef.current) return
    setSomeoneTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setSomeoneTyping(false), 3000)
  }, [])

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }, [])

  const currentUserName = isGuest
    ? guestName
    : (session?.user as { username?: string } | undefined)?.username || session?.user?.name || 'You'
  const currentUserNameRef = useRef(currentUserName)
  currentUserNameRef.current = currentUserName

  const sendChatMessage = useCallback((message: string) => {
    const currentUserId = currentUserIdRef.current
    if (currentUserId) {
      setChatMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        userId: currentUserId,
        username: currentUserNameRef.current ?? '',
        message,
        timestamp: Date.now(),
      }])
    }
    void fetchWithGuest(`/api/lobby/${code}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
  }, [code])

  const mergeHistoryMessages = useCallback((history: ChatMessagePayload[]) => {
    setChatMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const fresh = history.filter(m => !existingIds.has(m.id))
      return fresh.length > 0 ? [...fresh, ...prev] : prev
    })
  }, [])

  const resetUnread = useCallback(() => setUnreadCount(0), [])

  return {
    chatMessages,
    sendChatMessage,
    unreadCount,
    resetUnread,
    someoneTyping,
    onChatMessage,
    onPlayerTyping,
    mergeHistoryMessages,
    /** Escape hatch for local-only system messages (bot joined, game started). */
    setChatMessages,
  }
}

interface UseLobbyChatHistoryOptions {
  code: string
  isConnected: boolean
  isReconnecting: boolean
  mergeHistoryMessages: (history: ChatMessagePayload[]) => void
}

/** Loads persisted chat history once per connect (re-fetches on reconnect). */
export function useLobbyChatHistory({ code, isConnected, isReconnecting, mergeHistoryMessages }: UseLobbyChatHistoryOptions) {
  const { status } = useSession()
  const { isGuest, guestId, guestToken, guestName } = useGuest()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!isConnected) return
    if (status === 'loading') return
    if (isGuest && !guestToken) return
    if (loadedRef.current && !isReconnecting) return
    loadedRef.current = true

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isGuest && guestId && guestToken) {
      headers['X-Guest-Id'] = guestId
      headers['X-Guest-Token'] = guestToken
      if (guestName) headers['X-Guest-Name'] = guestName
    }

    fetch(`/api/lobby/${code}/chat`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          mergeHistoryMessages(data.messages as ChatMessagePayload[])
        }
      })
      .catch(() => {
        // non-critical; ignore
      })
  }, [isConnected, isReconnecting, status, isGuest, guestToken, guestId, guestName, code, mergeHistoryMessages])
}
