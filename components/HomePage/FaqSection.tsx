'use client'

import type { FaqFacts, FaqGame } from '@/lib/faq-facts'
import type { TranslationKeys } from '@/lib/i18n-helpers'
import { useTranslation } from '@/lib/i18n-helpers'

/**
 * "A, B and C". All four locales put the conjunction in the same place and none
 * of them takes a comma before it, so one shape covers them — the word itself
 * comes from the locale file. Intl.ListFormat would do this too, but its types
 * need lib ES2021 and the project targets ES2020.
 */
function joinList(names: string[], and: string): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
}

// The catalog's nameKey is a plain string; every value in it is a real
// translation key, which the locale-parity check enforces.
function localized(t: (key: TranslationKeys) => string, games: FaqGame[], and: string): string {
  return joinList(games.map((game) => t(game.nameKey as TranslationKeys)), and)
}

function english(games: FaqGame[]): string {
  return joinList(games.map((game) => game.nameEn), 'and')
}

function buildFaqJsonLd(facts: FaqFacts) {
  const qa: [string, string][] = [
    [
      'Is Boardly free to play?',
      `Every game on Boardly is free to play, with no download and no account required. Premium is an optional subscription at ${facts.premiumPrice} a month for extras like replays, custom lobby themes and full stats; free players may see ads.`,
    ],
    [
      'Do I need an account to play?',
      'No account is required. You can jump in as a guest instantly. Creating an account lets you save your stats and history across sessions.',
    ],
    [
      'What games are available on Boardly?',
      `Boardly currently offers ${english(facts.games)}. More games are in development and appear on the games page as they are released.`,
    ],
    [
      'Can I play solo?',
      `Yes. ${english(facts.botGames)} can add computer players, so you can start even when friends are offline.`,
    ],
    [
      'How do I play with friends online?',
      'Create a room, then share the room code or link with your friends. They join instantly — no account or download needed on their end either.',
    ],
    [
      'Does Boardly work on mobile?',
      'Yes. Boardly runs in any modern browser on desktop, tablet, and mobile. You can also install it from your browser if you want an app-like shortcut.',
    ],
    [
      'How many players can play at once?',
      `It depends on the game. Rooms run from 2 players up to ${facts.maxPlayers} in ${facts.maxPlayersGame.nameEn}. Each game page lists its own range.`,
    ],
    [
      'Is there anything to download or install?',
      'Nothing to download. Boardly runs entirely in your browser. Just open the site and start playing.',
    ],
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([name, text]) => ({
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text },
    })),
  }
}

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] as const
const FAQ_COLORS = [
  'var(--bd-coral)',
  'var(--bd-mint)',
  'var(--bd-sun)',
  'var(--bd-lav)',
] as const

export default function FaqSection({ facts }: { facts: FaqFacts }) {
  const { t } = useTranslation()

  // The four answers that name games or money take their values from the
  // catalog, so the copy cannot drift from what the site actually offers.
  const and = t('faq.listAnd')
  const answerVars: Partial<Record<(typeof FAQ_KEYS)[number], Record<string, string | number>>> = {
    q1: { price: facts.premiumPrice },
    q3: { games: localized(t, facts.games, and) },
    q4: { games: localized(t, facts.botGames, and) },
    q7: { max: facts.maxPlayers, game: t(facts.maxPlayersGame.nameKey as TranslationKeys) },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(facts)) }}
      />
      <section className="home-faq-section" aria-labelledby="home-faq-title">
        <div className="home-faq-intro">
          <span className="home-faq-kicker">FAQ</span>
          <h2 id="home-faq-title">{t('faq.title')}</h2>
          <p>{t('faq.intro')}</p>
        </div>

        <dl className="home-faq-list">
          {FAQ_KEYS.map((key, index) => (
            <div key={key} className="home-faq-item">
              <dt>
                <span style={{ background: FAQ_COLORS[index % FAQ_COLORS.length] }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {t(`faq.${key}.question`)}
              </dt>
              <dd>{t(`faq.${key}.answer`, answerVars[key])}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
