'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { TOUR_STEPS, type TourStep } from '@/lib/tour/tour-steps'

interface TourContextType {
  isActive: boolean
  currentStepIndex: number
  currentStep: TourStep | null
  steps: TourStep[]
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  /** Ends the tour without marking onboarding complete/skipped — used by the quick-start step, which marks completion itself. */
  endTour: () => void
  /** Ends the tour and marks onboarding as skipped. */
  skipTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()
  const { skipOnboarding } = useOnboarding()
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const steps = useMemo(
    () => TOUR_STEPS.filter((step) => !step.authOnly || status === 'authenticated'),
    [status]
  )

  const currentStep = isActive ? steps[currentStepIndex] ?? null : null

  // Navigate to the current step's route when it changes.
  useEffect(() => {
    if (!isActive || !currentStep?.route) return
    if (pathname !== currentStep.route) {
      router.push(currentStep.route)
    }
  }, [isActive, currentStep, pathname, router])

  const startTour = useCallback(() => {
    setCurrentStepIndex(0)
    setIsActive(true)
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStepIndex(0)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const skipTour = useCallback(() => {
    endTour()
    void skipOnboarding()
  }, [endTour, skipOnboarding])

  return (
    <TourContext.Provider
      value={{ isActive, currentStepIndex, currentStep, steps, startTour, nextStep, prevStep, endTour, skipTour }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour(): TourContextType {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used inside TourProvider')
  return ctx
}
