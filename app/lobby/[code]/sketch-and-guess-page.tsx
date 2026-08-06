'use client'

import LoadingSpinner from '@/components/LoadingSpinner'

interface SketchAndGuessLobbyPageProps {
    code: string
    isSpectator?: boolean
    onGameReset?: () => void
}

// Stage 4 will replace this with the full canvas-based game UI.
export default function SketchAndGuessLobbyPage({ code: _code, isSpectator: _isSpectator, onGameReset: _onGameReset }: SketchAndGuessLobbyPageProps) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner />
        </div>
    )
}
