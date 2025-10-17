'use client'

import { YahtzeeScorecard, YahtzeeCategory, calculateScore } from '@/lib/yahtzee'

interface ScorecardProps {
  scorecard: YahtzeeScorecard
  currentDice: number[]
  onSelectCategory: (category: YahtzeeCategory) => void
  canSelectCategory: boolean
  isCurrentPlayer: boolean
}

const categoryLabels: Record<YahtzeeCategory, string> = {
  ones: '⚀ Ones',
  twos: '⚁ Twos',
  threes: '⚂ Threes',
  fours: '⚃ Fours',
  fives: '⚄ Fives',
  sixes: '⚅ Sixes',
  threeOfKind: '🎲 Three of a Kind',
  fourOfKind: '🎲🎲 Four of a Kind',
  fullHouse: '🏠 Full House',
  smallStraight: '📈 Small Straight',
  largeStraight: '📊 Large Straight',
  yahtzee: '🎯 YAHTZEE!',
  chance: '🎲 Chance',
}

const categoryDescriptions: Record<YahtzeeCategory, string> = {
  ones: 'Sum of all ones',
  twos: 'Sum of all twos',
  threes: 'Sum of all threes',
  fours: 'Sum of all fours',
  fives: 'Sum of all fives',
  sixes: 'Sum of all sixes',
  threeOfKind: 'Sum of all dice (3+ same)',
  fourOfKind: 'Sum of all dice (4+ same)',
  fullHouse: '25 points',
  smallStraight: '30 points',
  largeStraight: '40 points',
  yahtzee: '50 points!',
  chance: 'Sum of all dice',
}

export default function Scorecard({ 
  scorecard, 
  currentDice, 
  onSelectCategory, 
  canSelectCategory,
  isCurrentPlayer 
}: ScorecardProps) {
  const upperSection: YahtzeeCategory[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
  const lowerSection: YahtzeeCategory[] = [
    'threeOfKind',
    'fourOfKind',
    'fullHouse',
    'smallStraight',
    'largeStraight',
    'yahtzee',
    'chance',
  ]

  const renderCategory = (category: YahtzeeCategory) => {
    const score = scorecard[category]
    const isFilled = score !== undefined
    const canSelect = canSelectCategory && !isFilled && isCurrentPlayer
    const potentialScore = !isFilled && currentDice.length > 0 ? calculateScore(currentDice, category) : null
    const isGoodScore = potentialScore !== null && potentialScore >= 20 // Highlight good scores

    return (
      <button
        key={category}
        onClick={() => canSelect && onSelectCategory(category)}
        disabled={!canSelect}
        className={`
          scorecard-row group relative
          ${isFilled ? 'cursor-default bg-gray-100 dark:bg-gray-800' : ''}
          ${canSelect && isGoodScore ? 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer ring-2 ring-green-400 dark:ring-green-600' : ''}
          ${canSelect && !isGoodScore ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : ''}
          ${!canSelect && !isFilled ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm md:text-base">{categoryLabels[category]}</span>
          {!isFilled && (
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
              {categoryDescriptions[category]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFilled ? (
            <span className="font-bold text-lg text-green-600 dark:text-green-400">
              {score}
            </span>
          ) : canSelect && potentialScore !== null ? (
            <div className="flex items-center gap-1">
              <span className={`text-lg font-semibold group-hover:scale-110 transition-transform ${
                isGoodScore ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                +{potentialScore}
              </span>
              {isGoodScore && <span className="text-xl animate-pulse">⭐</span>}
              {potentialScore === 50 && <span className="text-xl animate-bounce">🎯</span>}
            </div>
          ) : canSelect ? (
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Click to score
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </button>
    )
  }

  const upperTotal = upperSection.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0)
  const bonus = upperTotal >= 63 ? 35 : 0
  const lowerTotal = lowerSection.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0)
  const total = upperTotal + bonus + lowerTotal

  return (
    <div className={`card animate-fade-in ${
      !isCurrentPlayer ? 'opacity-90' : ''
    }`}>
      {/* Viewing Overlay for Other Players */}
      {!isCurrentPlayer && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👀</span>
            <div>
              <p className="font-bold text-yellow-700 dark:text-yellow-300">View Only Mode</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                You are viewing another player's scorecard. Switch to yours to make selections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upper Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">
          Upper Section
        </h3>
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {upperSection.map(renderCategory)}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
            <span className="font-semibold">Subtotal</span>
            <span className="font-bold">{upperTotal}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-gray-200 dark:border-gray-600">
            <span className="font-semibold">
              Bonus {upperTotal >= 63 ? '✓' : `(${upperTotal}/63)`}
            </span>
            <span className={`font-bold ${bonus > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
              {bonus > 0 ? `+${bonus}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-purple-600 dark:text-purple-400">
          Lower Section
        </h3>
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {lowerSection.map(renderCategory)}
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">🏆 Total Score</span>
          <span className="text-3xl font-bold">{total}</span>
        </div>
      </div>
    </div>
  )
}
