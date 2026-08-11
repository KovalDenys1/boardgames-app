'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n-helpers'
import { fetchWithGuest } from '@/lib/fetch-with-guest'
import { showToast } from '@/lib/i18n-toast'
import Modal from '@/components/Modal'
import { GAME_SVG_PATHS } from '@/components/GameIcon'
import { getAvailableGameTypes, getGameMetadata, hasBotSupport } from '@/lib/game-catalog'

// Catalog-driven: every game that is 'available' in the catalog shows up here
// automatically — including the ones without bot support, which Quick Play
// matches with humans instead of bot-filling (see /api/quick-play).
const QUICK_PLAY_GAMES = getAvailableGameTypes().map((type) => {
  const meta = getGameMetadata(type)!
  const supportsBots = hasBotSupport(type)
  const playerRange = meta.maxPlayers === 1 ? '1' : `${supportsBots ? 1 : meta.minPlayers}–${meta.maxPlayers}`
  return { type, svgId: meta.svgId, label: meta.name, players: playerRange, supportsBots }
})

type GameType = string

interface QuickPlayButtonProps {
  className?: string
}

export default function QuickPlayButton({ className }: QuickPlayButtonProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleGameSelect = async (gameType: GameType, supportsBots: boolean) => {
    setIsSearching(true)

    try {
      const res = await fetchWithGuest('/api/quick-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Quick play failed')
      }

      const { lobbyCode, isNew } = data as { lobbyCode: string; isNew: boolean }

      if (!isNew) {
        showToast.success('quickPlay.joinedLobby', undefined, undefined, { id: 'quick-play' })
      } else if (supportsBots) {
        showToast.success('quickPlay.createdLobby', undefined, undefined, { id: 'quick-play' })
      } else {
        showToast.success('quickPlay.waitingForPlayers', undefined, undefined, { id: 'quick-play' })
      }

      router.push(`/lobby/${lobbyCode}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      showToast.error('errors.general', undefined, { message: msg })
      setIsSearching(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className={className ?? 'home-cta-button home-cta-button-primary'}
      >
        <span>⚡</span>
        <span>{t('home.quickPlay', 'Quick Play')}</span>
      </button>

      <Modal
        isOpen={showPicker}
        onClose={() => {
          if (!isSearching) setShowPicker(false)
        }}
        title={`⚡ ${t('home.quickPlay', 'Quick Play')}`}
        maxWidth="md"
      >
        {isSearching ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <p style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>⚡</p>
            <p
              style={{
                fontFamily: 'var(--bd-font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--bd-ink)',
                marginBottom: 8,
              }}
            >
              {t('quickPlay.finding', 'Finding a game…')}
            </p>
            <p style={{ fontSize: 14, color: 'var(--bd-ink-soft)' }}>
              {t('quickPlay.searching', 'Looking for a room or setting one up for you')}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--bd-ink-soft)', marginBottom: 16 }}>
              {t('quickPlay.pickGame', "Pick a game — we'll find or create a match instantly.")}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 10,
              }}
            >
              {QUICK_PLAY_GAMES.map((game) => (
                <button
                  key={game.type}
                  onClick={() => handleGameSelect(game.type, game.supportsBots)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '12px 14px',
                    background: 'var(--bd-bg)',
                    border: '2px solid var(--bd-ink)',
                    borderRadius: 12,
                    boxShadow: '3px 3px 0 var(--bd-ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)'
                    e.currentTarget.style.boxShadow = '4px 4px 0 var(--bd-ink)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '3px 3px 0 var(--bd-ink)'
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--bd-sun)',
                      border: '2px solid var(--bd-ink)',
                      borderRadius: 10,
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      width={20}
                      height={20}
                      style={{ color: 'var(--bd-ink)' }}
                      dangerouslySetInnerHTML={{ __html: GAME_SVG_PATHS[game.svgId] ?? '' }}
                    />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: 'var(--bd-font-display)',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--bd-ink)',
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}
                    >
                      {game.label}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--bd-ink-muted)', marginBottom: 4 }}>
                      {game.players} {t('quickPlay.players')}
                    </p>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--bd-ink)',
                        background: game.supportsBots ? 'var(--bd-sun)' : 'var(--bd-bg2)',
                        border: '1.5px solid var(--bd-ink)',
                        borderRadius: 999,
                      }}
                    >
                      {game.supportsBots
                        ? `🤖 ${t('quickPlay.vsBots', 'Vs bots')}`
                        : `👥 ${t('quickPlay.withPlayers', 'With players')}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
