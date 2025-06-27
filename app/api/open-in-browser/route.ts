// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Create HTML that attempts multiple methods to open in external browser
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening in Browser - DreamSign</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f7fafc;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2d3748;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3182ce;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #2c5282;
    }
    .instructions {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e2e8f0;
    }
    .instruction-item {
      margin-bottom: 16px;
      text-align: left;
    }
    .app-name {
      font-weight: 600;
      color: #2d3748;
    }
    .copy-button {
      margin-top: 16px;
      padding: 8px 16px;
      background-color: #e2e8f0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: #2d3748;
    }
    .copy-button:hover {
      background-color: #cbd5e0;
    }
    .url-display {
      margin-top: 12px;
      padding: 12px;
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      word-break: break-all;
      font-size: 14px;
      color: #4a5568;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Please Open in Your Browser</h1>
    <p>For the best experience and to use Google Sign-In, please open DreamSign in your device's default browser.</p>
    
    <a href="${targetUrl}" class="button" id="openButton">Open in Browser</a>
    
    <div class="instructions">
      <h2 style="font-size: 18px; margin-bottom: 16px;">If the button doesn't work:</h2>
      
      <div class="instruction-item">
        <span class="app-name">Instagram/Facebook:</span> Tap the three dots (⋯) in the top right → "Open in Browser"
      </div>
      
      <div class="instruction-item">
        <span class="app-name">Twitter/X:</span> Tap the share icon → "Open in Safari" (iOS) or "Open in Browser" (Android)
      </div>
      
      <div class="instruction-item">
        <span class="app-name">LinkedIn:</span> Tap the three dots (⋯) → "Open in external browser"
      </div>
      
      <div class="instruction-item">
        <span class="app-name">Other apps:</span> Look for a menu option to open in your default browser
      </div>
      
      <p style="margin-top: 24px; font-size: 14px;">Or copy this URL and paste it in your browser:</p>
      <div class="url-display">${targetUrl}</div>
      <button class="copy-button" onclick="copyUrl()">Copy URL</button>
    </div>
  </div>

  <script>
    const targetUrl = ${JSON.stringify(targetUrl)};
    
    // Function to copy URL to clipboard
    function copyUrl() {
      navigator.clipboard.writeText(targetUrl).then(() => {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      });
    }
    
    // Attempt to open in external browser automatically
    function attemptExternalOpen() {
      // Method 1: Direct navigation (works in some cases)
      window.location.href = targetUrl;
      
      // Method 2: Window.open (might work in some browsers)
      setTimeout(() => {
        window.open(targetUrl, '_blank');
      }, 100);
      
      // Method 3: Create and click a link
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 200);
    }
    
    // Only attempt automatic opening on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attemptExternalOpen);
    } else {
      attemptExternalOpen();
    }
    
    // Add click handler to button for manual attempts
    document.getElementById('openButton').addEventListener('click', (e) => {
      e.preventDefault();
      attemptExternalOpen();
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