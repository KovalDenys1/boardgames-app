'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
            >
              🎲 BoardGames
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10 space-x-4">
              <button
                onClick={() => router.push('/')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                🏠 Home
              </button>
              
              {status === 'authenticated' && (
                <>
                  <button
                    onClick={() => router.push('/lobby')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/lobby')
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    🎮 Lobbies
                  </button>
                  <button
                    onClick={() => router.push('/lobby/create')}
                    className="px-3 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    ➕ Create Lobby
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : status === 'authenticated' ? (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-slide-in-up">
            <div className="space-y-2">
              <button
                onClick={() => {
                  router.push('/')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                🏠 Home
              </button>

              {status === 'authenticated' && (
                <>
                  <button
                    onClick={() => {
                      router.push('/lobby')
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive('/lobby')
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    🎮 Lobbies
                  </button>
                  <button
                    onClick={() => {
                      router.push('/lobby/create')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    ➕ Create Lobby
                  </button>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.user?.name || session.user?.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}

              {status === 'unauthenticated' && (
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    onClick={() => {
                      router.push('/auth/login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      router.push('/auth/register')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
