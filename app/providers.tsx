'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/contexts/ToastContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
