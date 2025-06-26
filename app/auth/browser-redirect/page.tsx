// app/auth/browser-redirect/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function BrowserRedirect() {
  const searchParams = useSearchParams()
  const [currentUrl, setCurrentUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [attemptedRedirect, setAttemptedRedirect] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the intended URL from search params
      const intended = searchParams.get('intended') || '/auth/signin'
      const fullUrl = `${window.location.origin}${intended}`
      setCurrentUrl(fullUrl)
      
      // Automatically attempt to open in browser on load
      if (!attemptedRedirect) {
        setAttemptedRedirect(true)
        setTimeout(() => {
          handleOpenInBrowser(fullUrl)
        }, 100)
      }
    }
  }, [searchParams, attemptedRedirect])

  const handleOpenInBrowser = (url?: string) => {
    const targetUrl = url || currentUrl
    
    // For iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Try multiple methods for iOS
      const schemes = [
        `x-safari-${targetUrl}`,
        targetUrl.replace('https://', 'safari-https://'),
        targetUrl
      ]
      
      schemes.forEach((scheme, index) => {
        setTimeout(() => {
          window.location.href = scheme
        }, index * 50)
      })
    } 
    // For Android
    else if (/Android/.test(navigator.userAgent)) {
      // Try intent URL for Android Chrome
      const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      window.location.href = intentUrl
      
      // Fallback to regular URL after a short delay
      setTimeout(() => {
        window.location.href = targetUrl
      }, 100)
    }
    // Desktop or other
    else {
      window.open(targetUrl, '_blank')
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Opening in Your Browser...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              If the browser didn't open automatically, please use one of the options below.
            </p>
          </div>

          <div className="space-y-4">
            {/* Manual open button */}
            <button
              onClick={() => handleOpenInBrowser()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open in Browser
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or copy link</span>
              </div>
            </div>

            {/* Copy URL option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Paste this link in Chrome, Safari, or your default browser
              </p>
            </div>

            {/* Why message */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Why am I seeing this?</strong> You're using an in-app browser. 
                Google requires authentication in a standard browser for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}