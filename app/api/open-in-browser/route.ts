// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
  // The key insight: In-app browsers often respect server-side redirects better than client-side
  // Let's try a 302 redirect first - this works in many in-app browsers
  if (redirectUrl && redirectUrl !== '/') {
    // Clean the URL to ensure it's valid
    let cleanUrl = redirectUrl;
    
    // If the URL doesn't have a protocol, add https://
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Try direct server redirect - this often bypasses in-app browser restrictions
    return NextResponse.redirect(cleanUrl, {
      status: 302,
      headers: {
        'Location': cleanUrl,
        // These headers can help with some in-app browsers
        'X-Redirect-Reason': 'in-app-browser-escape',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
  
  // If direct redirect doesn't work, fallback to HTML/JS methods
  // But keep it VERY simple - complexity seems to break things
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Opening...</title>
<script>window.location.href='${redirectUrl}';</script>
<meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
<a href="${redirectUrl}" id="r">Continue</a>
<script>document.getElementById('r').click();</script>
</body>
</html>`;
  
  return new NextResponse(html, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}