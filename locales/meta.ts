export const availableLocales = ['en', 'uk', 'no', 'ru'] as const
export type Locale = (typeof availableLocales)[number]
export const defaultLocale: Locale = 'en'
