// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Create an HTML page that attempts to open the URL in the default browser
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening in Browser...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
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
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .instructions {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #e5e5e5;
    }
    .instructions h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
    }
    .browser-icons {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
    }
    .browser-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }
    .icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Please Open in Your Browser</h1>
    <p>To sign in with Google, you need to use your device's default browser instead of this app.</p>
    
    <a href="${targetUrl}" class="button" id="openButton">Open in Browser</a>
    
    <div class="instructions">
      <h2>How to open in browser:</h2>
      <ol style="text-align: left; color: #666; line-height: 1.8;">
        <li>Tap the three dots (⋮) or menu icon</li>
        <li>Select "Open in Browser" or "Open in Chrome/Safari"</li>
        <li>Or copy this link and paste in your browser</li>
      </ol>
      
      <div style="margin-top: 20px; padding: 12px; background-color: #f5f5f5; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px; color: #666;">
        ${targetUrl}
      </div>
    </div>
  </div>

  <script>
    // Attempt to open in default browser using various methods
    const targetUrl = ${JSON.stringify(targetUrl)};
    
    // Method 1: Try to use intent for Android
    if (/android/i.test(navigator.userAgent)) {
      // Try Android intent
      window.location.href = 'intent:' + targetUrl + '#Intent;end';
      
      // Fallback after a delay
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
    }
    
    // Method 2: For iOS, try to detect and handle appropriately
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      // For iOS in-app browsers, we can't force external browser
      // But we can try to open the URL which might prompt the user
      document.getElementById('openButton').addEventListener('click', (e) => {
        e.preventDefault();
        
        // Try to open in Safari
        const a = document.createElement('a');
        a.href = targetUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Also try location.href as fallback
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 100);
      });
    }
    
    // Method 3: Copy to clipboard functionality
    document.addEventListener('DOMContentLoaded', () => {
      const button = document.getElementById('openButton');
      let clickCount = 0;
      
      button.addEventListener('click', () => {
        clickCount++;
        
        // After 2 clicks, also try to copy the URL
        if (clickCount >= 2) {
          try {
            navigator.clipboard.writeText(targetUrl).then(() => {
              alert('Link copied to clipboard! Please paste it in your browser.');
            });
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }
      });
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}