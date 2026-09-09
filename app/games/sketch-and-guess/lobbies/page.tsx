import type { Metadata } from 'next'
import GameLobbiesPage from '@/app/games/components/GameLobbiesPage'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://boardly.online/games/sketch-and-guess/lobbies' },
}

export default function SketchAndGuessLobbiesPage() {
  return (
    <GameLobbiesPage
      gameType="sketch_and_guess"
      gameId="guess-my-drawing"
      accentColor="var(--bd-mint)"
      pagePath="/games/sketch-and-guess/lobbies"
      gameNameKey="games.guess_my_drawing.name"
      lobbiesNamespace="games.guess_my_drawing.lobbies"
    />
  )
}
