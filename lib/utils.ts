/**
 * Detects if the user is in an embedded browser (WebView, in-app browser, etc.)
 * This is useful for redirecting users to the main site for OAuth flows
 * that don't work properly in embedded browsers.
 */
export function isEmbeddedBrowser(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  // Check for common embedded browser indicators
  const embeddedIndicators = [
    'wv', // Android WebView
    'webview',
    'instagram',
    'fbav', // Facebook in-app browser
    'fban', // Facebook in-app browser
    'twitter',
    'linkedin',
    'whatsapp',
    'telegram',
    'snapchat',
    'tiktok',
    'line',
    'wechat',
    'qq',
    'ucbrowser',
    'opera mini',
    'opera touch',
    'samsungbrowser',
    'miuibrowser',
    'huaweibrowser',
    'edgewebview',
    'ms-appx-webview',
    'cordova',
    'phonegap',
    'ionic',
    'capacitor'
  ]
  
  // Additional checks for LinkedIn specifically
  const isLinkedIn = userAgent.includes('linkedin') || 
                    (window as any).LinkedInApp || 
                    (window as any).linkedin
  
  // Check if we're in a WebView or iframe
  const isInWebView = (window as any).ReactNativeWebView || 
                     (window as any).webkit?.messageHandlers ||
                     window.self !== window.top
  
  return embeddedIndicators.some(indicator => userAgent.includes(indicator)) || 
         isLinkedIn || 
         isInWebView
}

/**
 * Specifically detects LinkedIn embedded browser
 */
export function isLinkedInBrowser(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('linkedin') || 
         (window as any).LinkedInApp || 
         (window as any).linkedin ||
         window.self !== window.top // LinkedIn often uses iframes
}

/**
 * Redirects to the main site (dreamsign.ai) with Google OAuth already initiated.
 * This is used when users are in embedded browsers where OAuth flows don't work properly.
 * The main site will automatically redirect to Google OAuth when accessed with provider=google.
 */
export function redirectToMainSiteWithGoogleAuth(callbackUrl?: string): void {
  if (typeof window === 'undefined') return
  
  const baseUrl = 'https://dreamsign.ai'
  const autoAuthPath = '/api/auth/auto-google'
  const googleAuthUrl = `${baseUrl}${autoAuthPath}?provider=google`
  
  // Add callback URL if provided
  const finalUrl = callbackUrl 
    ? `${googleAuthUrl}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : googleAuthUrl
  
  // Try multiple methods to ensure the redirect works in embedded browsers
  try {
    // Method 1: Try to open in new window/tab (most reliable for embedded browsers)
    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer')
    
    // Method 2: If window.open fails or is blocked, try direct navigation
    if (!newWindow || newWindow.closed) {
      window.location.href = finalUrl
    }
  } catch (error) {
    // Method 3: Fallback to direct navigation
    window.location.href = finalUrl
  }
}

/**
 * Force redirect to main site with Google OAuth - use this when you want to ensure
 * the user gets to the main site regardless of browser detection
 */
export function forceRedirectToMainSiteWithGoogleAuth(callbackUrl?: string): void {
  if (typeof window === 'undefined') return
  
  const baseUrl = 'https://dreamsign.ai'
  const autoAuthPath = '/api/auth/auto-google'
  const googleAuthUrl = `${baseUrl}${autoAuthPath}?provider=google`
  
  // Add callback URL if provided
  const finalUrl = callbackUrl 
    ? `${googleAuthUrl}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : googleAuthUrl
  
  // Force redirect using multiple methods
  try {
    // Method 1: Try window.open first (most reliable for LinkedIn)
    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer')
    
    // Method 2: If that fails, use location.replace for a more forceful redirect
    if (!newWindow || newWindow.closed) {
      window.location.replace(finalUrl)
    }
  } catch (error) {
    // Method 3: Final fallback - try multiple approaches
    try {
      window.location.replace(finalUrl)
    } catch {
      window.location.href = finalUrl
    }
  }
}
