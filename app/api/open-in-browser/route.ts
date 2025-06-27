// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  if (userAgent.includes('LinkedIn')) {
    // For LinkedIn, redirect to a page that opens in external browser
    return NextResponse.redirect(`/open-external?url=${encodeURIComponent(url)}`, 302);
  }
  
  return NextResponse.redirect(url, 302);
}