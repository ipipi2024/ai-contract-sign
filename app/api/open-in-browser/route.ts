// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's LinkedIn's embedded browser
  const isLinkedInBrowser = userAgent.includes('LinkedIn') || 
                           userAgent.includes('FBAN') || 
                           userAgent.includes('FBAV');
  
  if (isLinkedInBrowser) {
    // For LinkedIn browser, redirect to a page that will open in external browser
    const redirectUrl = `/open-external?url=${encodeURIComponent(url)}`;
    return NextResponse.redirect(redirectUrl, 302);
  }
  
  // If not LinkedIn browser, just redirect normally
  return NextResponse.redirect(url, 302);
}