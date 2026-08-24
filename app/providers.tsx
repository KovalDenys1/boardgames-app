'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/contexts/ToastContext'
import { GuestProvider } from '@/contexts/GuestContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { TourProvider } from '@/contexts/TourContext'
import DeferredGlobalEffects from '@/components/DeferredGlobalEffects'
import i18n, { changeLanguageLazy, type Locale } from '@/i18n'
import { getStoredAppearanceLocale } from '@/lib/appearance-preferences'
import { getSafeLocalStorage } from '@/lib/safe-storage'

const OnboardingModal = dynamic(
  () => import('@/components/Onboarding/OnboardingModal').then((mod) => mod.OnboardingModal),
  { ssr: false }
)
const TourOverlay = dynamic(
  () => import('@/components/Tour/TourOverlay').then((mod) => mod.TourOverlay),
  { ssr: false }
)
const GlobalToaster = dynamic(
  () => import('react-hot-toast').then((mod) => mod.Toaster),
  { ssr: false }
)

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const nextLanguage = getStoredAppearanceLocale(getSafeLocalStorage() ?? undefined) as Locale

    if (i18n.language !== nextLanguage) {
      void changeLanguageLazy(nextLanguage)
    }
  }, [])

  return (
    <SessionProvider basePath="/api/auth">
      <GuestProvider>
        <OnboardingProvider>
          <TourProvider>
            <ToastProvider>
              <GlobalToaster position="top-right" />
              <DeferredGlobalEffects />
              <OnboardingModal />
              <TourOverlay />
              {children}
            </ToastProvider>
          </TourProvider>
        </OnboardingProvider>
      </GuestProvider>
    </SessionProvider>
  )
}
