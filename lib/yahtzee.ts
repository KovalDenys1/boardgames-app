// Yahtzee scoring categories
export type YahtzeeCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfKind' | 'fourOfKind' | 'fullHouse' | 'smallStraight'
  | 'largeStraight' | 'yahtzee' | 'chance'

export interface YahtzeeScorecard {
  ones?: number
  twos?: number
  threes?: number
  fours?: number
  fives?: number
  sixes?: number
  threeOfKind?: number
  fourOfKind?: number
  fullHouse?: number
  smallStraight?: number
  largeStraight?: number
  yahtzee?: number
  chance?: number
}

export interface YahtzeeGameState {
  round: number
  currentPlayerIndex: number
  dice: number[] // 5 dice values (1-6)
  held: boolean[] // which dice are held
  rollsLeft: number
  scores: YahtzeeScorecard[]
  finished: boolean
}

export function rollDice(count: number = 5): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
}

export function calculateScore(dice: number[], category: YahtzeeCategory): number {
  const counts = Array(7).fill(0)
  dice.forEach(die => counts[die]++)
  
  const sortedDice = [...dice].sort((a, b) => a - b)
  
  switch (category) {
    case 'ones': return counts[1] * 1
    case 'twos': return counts[2] * 2
    case 'threes': return counts[3] * 3
    case 'fours': return counts[4] * 4
    case 'fives': return counts[5] * 5
    case 'sixes': return counts[6] * 6
    
    case 'threeOfKind':
      return counts.some(c => c >= 3) ? dice.reduce((a, b) => a + b, 0) : 0
    
    case 'fourOfKind':
      return counts.some(c => c >= 4) ? dice.reduce((a, b) => a + b, 0) : 0
    
    case 'fullHouse': {
      const hasThree = counts.some(c => c === 3)
      const hasTwo = counts.some(c => c === 2)
      return (hasThree && hasTwo) ? 25 : 0
    }
    
    case 'smallStraight': {
      const straights = ['1234', '2345', '3456']
      const diceStr = [...new Set(sortedDice)].join('')
      return straights.some(s => diceStr.includes(s)) ? 30 : 0
    }
    
    case 'largeStraight': {
      const straights = ['12345', '23456']
      const diceStr = sortedDice.join('')
      return straights.includes(diceStr) ? 40 : 0
    }
    
    case 'yahtzee':
      return counts.some(c => c === 5) ? 50 : 0
    
    case 'chance':
      return dice.reduce((a, b) => a + b, 0)
    
    default:
      return 0
  }
}

export function calculateTotalScore(scorecard: YahtzeeScorecard): number {
  const upperSection = (scorecard.ones || 0) + (scorecard.twos || 0) + 
    (scorecard.threes || 0) + (scorecard.fours || 0) + 
    (scorecard.fives || 0) + (scorecard.sixes || 0)
  
  const upperBonus = upperSection >= 63 ? 35 : 0
  
  const lowerSection = (scorecard.threeOfKind || 0) + (scorecard.fourOfKind || 0) +
    (scorecard.fullHouse || 0) + (scorecard.smallStraight || 0) +
    (scorecard.largeStraight || 0) + (scorecard.yahtzee || 0) +
    (scorecard.chance || 0)
  
  return upperSection + upperBonus + lowerSection
}

export function isGameFinished(scorecard: YahtzeeScorecard): boolean {
  const categories: YahtzeeCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ]
  
  return categories.every(cat => scorecard[cat] !== undefined)
}
