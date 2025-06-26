// app/auth/redirect/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function EmbeddedBrowserRedirect() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Get the original URL from sessionStorage or construct it
      const storedUrl = sessionStorage.getItem('oauth_redirect_url')
      const url = storedUrl || `${window.location.origin}/auth/signin`
      setCurrentUrl(url)
    }
  }, [])

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

  const handleOpenInBrowser = () => {
    // Try different methods to open in external browser
    const url = currentUrl

    // For iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Try to open in Safari
      window.location.href = `x-safari-${url}`
      setTimeout(() => {
        window.location.href = url
      }, 25)
    } 
    // For Android
    else if (/Android/.test(navigator.userAgent)) {
      // Try intent URL for Android
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      setTimeout(() => {
        window.location.href = url
      }, 25)
    }
    // Fallback
    else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center mb-6">
            <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Open in Your Browser
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Google Sign-In requires your default browser for security reasons.
            </p>
          </div>

          <div className="space-y-4">
            {/* Option 1: Try automatic redirect */}
            <button
              onClick={handleOpenInBrowser}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open in Browser
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or manually</span>
              </div>
            </div>

            {/* Option 2: Copy URL */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Copy this link and paste it in Chrome, Safari, or your default browser:
              </p>
              
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
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Why am I seeing this?
              </h3>
              <p className="text-sm text-blue-700">
                You're using an in-app browser (like Twitter, LinkedIn, or Instagram's browser). 
                Google requires authentication to happen in a standard browser for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}