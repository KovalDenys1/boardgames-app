import i18n from '@/i18n'

describe('i18n language persistence', () => {
  it('does not let the browser language detector auto-write to localStorage', () => {
    // Regression test for #696: with detection.caches including 'localStorage',
    // i18next-browser-languagedetector re-caches its htmlTag-detected value
    // (always 'en', the SSR default) into localStorage on every fresh page
    // load — silently clobbering whatever locale the user had actually
    // picked via lib/appearance-preferences.ts before Providers' effect gets
    // a chance to read it back out. Persistence must be handled exclusively
    // by setStoredAppearanceLocale/getStoredAppearanceLocale.
    expect(i18n.options.detection?.caches).toEqual([])
  })

  it('only detects from htmlTag, never re-derives from its own storage cache', () => {
    expect(i18n.options.detection?.order).toEqual(['htmlTag'])
  })
})
