import { YahtzeeBotAI } from '@/lib/bots/yahtzee/yahtzee-bot-ai'

describe('YahtzeeBotAI short mode (#779)', () => {
  it('selectCategory never returns an upper-section category in short mode', () => {
    // All lower categories filled except chance; dice scream 'sixes'
    const scorecard = {
      onePair: 12,
      twoPairs: 8,
      threeOfKind: 18,
      fourOfKind: 24,
      fullHouse: 25,
      smallStraight: 30,
      largeStraight: 40,
      yahtzee: 50,
    }
    const category = YahtzeeBotAI.selectCategory([6, 6, 6, 6, 6], scorecard, 'short')
    expect(category).toBe('chance')
  })

  it('selectCategory may use upper categories in classic mode', () => {
    const scorecard = {
      onePair: 12,
      twoPairs: 8,
      threeOfKind: 18,
      fourOfKind: 24,
      fullHouse: 25,
      smallStraight: 30,
      largeStraight: 40,
      yahtzee: 50,
      chance: 30,
    }
    const category = YahtzeeBotAI.selectCategory([6, 6, 6, 6, 6], scorecard, 'classic')
    expect(category).toBe('sixes')
  })

  it('decideDiceToHold works with a short-mode scorecard', () => {
    const held = YahtzeeBotAI.decideDiceToHold([6, 6, 6, 1, 2], [false, false, false, false, false], 2, {}, 'short')
    expect(Array.isArray(held)).toBe(true)
  })
})
