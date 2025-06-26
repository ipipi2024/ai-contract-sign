// app/hooks/useEmbeddedBrowserDetection.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useEmbeddedBrowserDetection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const detectAndRedirect = () => {
      const ua = navigator.userAgent || navigator.vendor || ''
      
      // Detect embedded browsers
      const isEmbedded = 
        // Facebook
        ua.includes('FBAN') || 
        ua.includes('FBAV') ||
        // Instagram
        ua.includes('Instagram') ||
        // Twitter
        ua.includes('Twitter') ||
        // LinkedIn
        ua.includes('LinkedIn') ||
        // Reddit
        ua.includes('Reddit') ||
        // TikTok
        ua.includes('TikTok') ||
        // Snapchat
        ua.includes('Snapchat') ||
        // Pinterest
        ua.includes('Pinterest') ||
        // Generic WebView detection
        (ua.includes('wv') && ua.includes('Android')) ||
        // iOS WebView
        (ua.includes('Mobile/') && !ua.includes('Safari/'))

      if (isEmbedded) {
        // Get the current URL
        const currentUrl = window.location.href
        
        // Check if we're already on the redirect page
        if (!window.location.pathname.includes('/auth/redirect')) {
          // Store the intended destination
          sessionStorage.setItem('oauth_redirect_url', currentUrl)
          
          // Redirect to intermediate page
          router.push('/auth/redirect')
        }
      }
    }

    detectAndRedirect()
  }, [router])

  return null
}