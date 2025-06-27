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
  
  return embeddedIndicators.some(indicator => userAgent.includes(indicator))
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
  
  window.location.href = finalUrl
}
