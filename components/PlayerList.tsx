'use client'

interface Player {
  id: string
  userId: string
  user: {
    username: string | null
    email: string | null
  }
  score: number
  position: number
  isReady: boolean
}

interface PlayerListProps {
  players: Player[]
  currentTurn: number
  currentUserId?: string
}

export default function PlayerList({ players, currentTurn, currentUserId }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => a.position - b.position)

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-center">👥 Players</h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isCurrentTurn = index === currentTurn
          const isCurrentUser = player.userId === currentUserId
          const playerName = player.user.username || player.user.email || 'Player'

          return (
            <div
              key={player.id}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isCurrentTurn 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105 animate-pulse' 
                  : 'border-gray-200 dark:border-gray-700'
                }
                ${isCurrentUser ? 'ring-2 ring-green-500' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Position Badge */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                    ${index === 0 ? 'bg-yellow-500' : ''}
                    ${index === 1 ? 'bg-gray-400' : ''}
                    ${index === 2 ? 'bg-orange-600' : ''}
                    ${index >= 3 ? 'bg-gray-500' : ''}
                  `}>
                    {index + 1}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {playerName}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {isCurrentTurn && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-bounce-in">
                          🎲 Turn
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Score: <span className="font-bold">{player.score}</span>
                    </div>
                  </div>
                </div>

                {/* Ready Status */}
                {player.isReady && (
                  <div className="text-green-500 font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
