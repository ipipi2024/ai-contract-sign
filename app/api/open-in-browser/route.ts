// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform and browser
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FBBR/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  const isTwitter = /Twitter/i.test(userAgent);
  const isLinkedIn = /LinkedInApp/i.test(userAgent);
  const isTikTok = /TikTok|Musical.ly/i.test(userAgent);
  
  // Clean and validate the URL
  let cleanUrl = redirectUrl;
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // Get the host from the request
    const host = request.headers.get('host') || '';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    cleanUrl = `${protocol}://${host}${cleanUrl}`;
  }

  // For some browsers, especially Facebook, we need to use intent URLs on Android
  if (isAndroid) {
    // Create an intent URL that opens in the default browser
    const intentUrl = `intent:${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening in Browser...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      text-align: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #007AFF;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .button:hover {
      background: #0051D5;
    }
    .secondary-link {
      display: inline-block;
      margin-top: 20px;
      color: #007AFF;
      text-decoration: none;
      font-size: 14px;
    }
    .browser-note {
      margin-top: 30px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Open in Browser</h1>
    <p>For the best experience, please open this link in your default browser.</p>
    
    <a href="${intentUrl}" class="button" id="intent-link">Open in Chrome</a>
    
    <a href="${cleanUrl}" class="secondary-link" id="direct-link">Or continue here</a>
    
    <p class="browser-note">
      ${isFacebook ? 'Tap the menu (⋯) and select "Open in External Browser"' : ''}
      ${isInstagram ? 'Tap the menu (⋯) and select "Open in External Browser"' : ''}
      ${isTwitter ? 'Tap the share icon and select "Open in Browser"' : ''}
      ${isLinkedIn ? 'Tap the menu and select "Open in Browser"' : ''}
      ${isTikTok ? 'Tap the menu and select "Open in Browser"' : ''}
    </p>
  </div>

  <script>
    // Try multiple methods to open in browser
    window.onload = function() {
      // Method 1: Try intent URL (Android only)
      if (${isAndroid}) {
        setTimeout(function() {
          window.location.href = '${intentUrl}';
        }, 100);
        
        // Fallback: If intent doesn't work, try direct navigation
        setTimeout(function() {
          window.location.href = '${cleanUrl}';
        }, 2000);
      }
      
      // Method 2: Try to open in new window (might work in some browsers)
      const newWindow = window.open('${cleanUrl}', '_blank');
      if (!newWindow || newWindow.closed) {
        // If popup blocked, try direct navigation
        setTimeout(function() {
          window.location.href = '${cleanUrl}';
        }, 500);
      }
    };
    
    // Method 3: Click handlers for manual action
    document.getElementById('intent-link').addEventListener('click', function(e) {
      if (!${isAndroid}) {
        e.preventDefault();
        window.location.href = '${cleanUrl}';
      }
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // iOS Strategy - use Universal Links or Smart App Banners
  if (isIOS) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening in Safari...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      text-align: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #007AFF;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 500;
    }
    .instructions {
      margin-top: 30px;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 8px;
      font-size: 14px;
      color: #666;
    }
    .step {
      margin: 10px 0;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Open in Safari</h1>
    <p>This page works best in Safari.</p>
    
    <a href="${cleanUrl}" class="button">Continue to Site</a>
    
    <div class="instructions">
      ${isFacebook ? `
      <p><strong>To open in Safari:</strong></p>
      <div class="step">1. Tap the menu (⋯) at the bottom</div>
      <div class="step">2. Select "Open in Safari"</div>
      ` : ''}
      ${isInstagram ? `
      <p><strong>To open in Safari:</strong></p>
      <div class="step">1. Tap the menu (⋯) at the top right</div>
      <div class="step">2. Select "Open in System Browser"</div>
      ` : ''}
      ${isTwitter ? `
      <p><strong>To open in Safari:</strong></p>
      <div class="step">1. Tap the share icon</div>
      <div class="step">2. Select "Open in Safari"</div>
      ` : ''}
      ${!isFacebook && !isInstagram && !isTwitter ? `
      <p>If the page doesn't open automatically, please copy the link and open it in Safari.</p>
      ` : ''}
    </div>
  </div>

  <script>
    // iOS doesn't allow automatic opening of Safari from in-app browsers
    // But we can try a few things:
    
    // Method 1: Try direct navigation (might work in some cases)
    setTimeout(function() {
      window.location.href = '${cleanUrl}';
    }, 1000);
    
    // Method 2: Try to detect if we're still in the in-app browser after redirect
    setTimeout(function() {
      if (window.navigator.standalone === false) {
        // We're still in an in-app browser
        // Show instructions more prominently
        document.querySelector('.instructions').style.border = '2px solid #007AFF';
      }
    }, 3000);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Default fallback for desktop or unknown browsers
  // Try a simple redirect
  return NextResponse.redirect(cleanUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}