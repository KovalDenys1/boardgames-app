import { buildFaqFacts } from '@/lib/faq-facts'
import { getCatalogAvailableGames, getGameMetadata, hasBotSupport } from '@/lib/game-catalog'

describe('home page FAQ facts', () => {
  const facts = buildFaqFacts()
  const availableTypes = getCatalogAvailableGames().map((game) => game.gameType)

  it('names every available game and nothing else', () => {
    // #878: the hand-written FAQ listed five games and still called Alias
    // "in development" four months after it shipped.
    const expected = availableTypes.map((type) => getGameMetadata(type!)!.name)
    const named = facts.games.map((game) => game.nameEn)
    expect(named).toEqual(expected)
    // The two the old copy got wrong in both directions
    expect(named).toContain('Alias')
    expect(named).toContain('Rock Paper Scissors')
    // Still unreleased — naming them on the home page would be a promise
    expect(named).not.toContain("Liar's Party")
    expect(named).not.toContain('Sketch & Guess')
  })

  it('names only the games that actually take bots', () => {
    const expected = availableTypes.filter((type) => hasBotSupport(type!)).map((type) => getGameMetadata(type!)!.name)
    expect(facts.botGames.map((game) => game.nameEn)).toEqual(expected)
    expect(facts.botGames.length).toBeLessThan(facts.games.length)
  })

  it('quotes the largest room any available game supports', () => {
    const maxima = availableTypes.map((type) => getGameMetadata(type!)!.maxPlayers)
    expect(facts.maxPlayers).toBe(Math.max(...maxima))
    expect(getGameMetadata(availableTypes.find((type) => getGameMetadata(type!)!.name === facts.maxPlayersGame.nameEn)!)!.maxPlayers).toBe(facts.maxPlayers)
  })

  it('carries a price for the Premium answer', () => {
    // The old q1 said "no subscriptions, no ads, and no paywalls" while
    // Premium was live and the AdSense loader had shipped.
    expect(facts.premiumPrice).toMatch(/\d/)
  })

  it('gives every game a real translation key', () => {
    for (const game of [...facts.games, ...facts.botGames, facts.maxPlayersGame]) {
      expect(game.nameKey).toMatch(/^games\.[a-z_]+\.name$/)
    }
  })
})
