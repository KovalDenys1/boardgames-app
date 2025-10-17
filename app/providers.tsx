'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/contexts/ToastContext'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <Toaster position="top-center" />
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
