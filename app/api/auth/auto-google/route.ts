import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  if (provider === 'google') {
    // Redirect directly to NextAuth's Google signin endpoint
    const baseUrl = request.nextUrl.origin
    const googleAuthUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
    return NextResponse.redirect(googleAuthUrl)
  }
  
  // If no provider specified or invalid provider, redirect to signin page
  return NextResponse.redirect(new URL('/auth/signin', request.url))
} 