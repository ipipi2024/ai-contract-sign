'use client'

// components/Header.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface HeaderProps {
  authenticated?: boolean
}

export default function Header({ authenticated = true }: HeaderProps) {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
      if (!target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}  
          <Link href={authenticated ? "/" : "/auth/signin"} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">DreamSign</span>
            </Link>

          {authenticated ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {/* <Link 
                  href="/dashboard" 
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                >
                  Dashboard
                </Link> */}
                <Link 
                  href="/contracts" 
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                >
                  Dashboard
                </Link>
                
                <div className="ml-4 pl-4 border-l border-gray-200">
                  <Link
                    href="/contracts/new"
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-sm font-medium shadow-sm hover:shadow active:shadow-md"
                  >
                    Create Contract
                  </Link>
                </div>

                {/* User Menu */}
                <div className="ml-3 relative user-menu-container">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 active:text-gray-900 transition-all p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{session?.user?.email}</p>
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <div className="md:hidden mobile-menu-container">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 hover:text-gray-900 active:text-gray-900 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated Header */
            <nav className="flex items-center space-x-2">
              <Link 
                href="/auth/signin" 
                className="px-3 md:px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 active:text-gray-900 transition-all text-sm md:text-base font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-3 md:px-5 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-sm md:text-base font-medium shadow-sm hover:shadow active:shadow-md"
              >
                Get Started
              </Link>
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Menu - Authenticated Users */}
      {authenticated && isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1 flex flex-col justify-center min-h-[200px]">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 active:text-gray-900 transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/contracts" 
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 active:text-gray-900 transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contracts
            </Link>
            
            <div className="pt-1">
              <Link 
                href="/contracts/new" 
                className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create Contract
              </Link>
            </div>
            
            <hr className="my-2" />
            
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleSignOut()
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 active:text-gray-900 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}