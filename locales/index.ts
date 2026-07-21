import en from './en'
import uk from './uk'
import no from './no'
import ru from './ru'

export const locales = {
  en,
  uk,
  no,
  ru,
} as const

export { availableLocales, defaultLocale } from './meta'
export type { Locale } from './meta'

export { default as en } from './en'
export { default as uk } from './uk'
export { default as no } from './no'
export { default as ru } from './ru'
export type { Translation } from './en'
