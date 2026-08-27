import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { getGameMetadata } from '@/lib/game-catalog'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params

  let title = 'Join a Game — Boardly'
  let description = 'Play board games online with friends on Boardly.'

  try {
    const lobby = await prisma.lobbies.findUnique({
      where: { code },
      select: {
        gameType: true,
        isActive: true,
        creator: { select: { username: true } },
        games: {
          where: { status: 'waiting' },
          select: { _count: { select: { players: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        maxPlayers: true,
      },
    })

    if (lobby && lobby.isActive) {
      const meta = getGameMetadata(lobby.gameType)
      const gameName = meta?.name ?? lobby.gameType
      const host = lobby.creator?.username ?? 'Someone'
      const players = lobby.games[0]?._count?.players ?? 0
      title = `Join ${host}'s ${gameName} lobby — Boardly`
      description = `${players}/${lobby.maxPlayers} players. Click to join and play ${gameName} right now!`
    }
  } catch {
    // fallback
  }

  const ogImageUrl = `/api/og/lobby/${code}`

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  // translate="no" (#772): page translators (Google Translate et al.) replace
  // React's text nodes with <font> wrappers, so React's later removeChild of
  // the original node throws NotFoundError and the game page dies — this was
  // the single largest error bucket in Sentry. In-game UI is highly dynamic
  // and the app already ships its own 4-locale i18n, so auto-translating it
  // buys nothing. Marketing pages and guides stay translatable.
  return <div translate="no" className="contents">{children}</div>
}
