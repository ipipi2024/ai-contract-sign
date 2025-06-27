// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Create HTML with improved browser-opening strategies
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="no">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
  <title>Open in Browser - DreamSign</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f7fafc;
      padding: 20px;
      color: #2d3748;
    }
    
    .container {
      text-align: center;
      max-width: 500px;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      width: 100%;
    }
    
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background-color: #FEF3C7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .icon svg {
      width: 32px;
      height: 32px;
      color: #F59E0B;
    }
    
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .subtitle {
      color: #718096;
      line-height: 1.6;
      margin-bottom: 32px;
      font-size: 16px;
    }
    
    .button-container {
      margin-bottom: 32px;
    }
    
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      background-color: #3182ce;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 16px;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      width: 100%;
      max-width: 280px;
      margin-bottom: 12px;
    }
    
    .button:hover {
      background-color: #2c5282;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .button svg {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
    
    .secondary-button {
      background-color: #4a5568;
    }
    
    .secondary-button:hover {
      background-color: #2d3748;
    }
    
    .divider {
      margin: 32px 0;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: #e2e8f0;
    }
    
    .divider span {
      padding: 0 16px;
      color: #a0aec0;
      font-size: 14px;
      font-weight: 500;
    }
    
    .instructions {
      text-align: left;
    }
    
    .instructions h2 {
      font-size: 16px;
      margin-bottom: 16px;
      color: #2d3748;
      text-align: center;
    }
    
    .app-instruction {
      margin-bottom: 16px;
      padding: 12px;
      background-color: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .app-name {
      font-weight: 600;
      color: #2d3748;
      display: block;
      margin-bottom: 4px;
    }
    
    .app-steps {
      color: #4a5568;
      font-size: 14px;
    }
    
    .url-section {
      margin-top: 24px;
      padding: 20px;
      background-color: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .url-label {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 8px;
    }
    
    .url-display {
      padding: 12px;
      background-color: white;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      word-break: break-all;
      font-size: 13px;
      color: #2d3748;
      margin-bottom: 12px;
      font-family: monospace;
      user-select: all;
      -webkit-user-select: all;
    }
    
    .copy-button {
      padding: 8px 16px;
      background-color: white;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #2d3748;
      font-weight: 500;
      transition: all 0.2s;
      width: 100%;
    }
    
    .copy-button:hover {
      background-color: #f7fafc;
      border-color: #a0aec0;
    }
    
    .copy-button.copied {
      background-color: #C6F6D5;
      border-color: #68D391;
      color: #22543D;
    }
    
    .hidden {
      display: none;
    }
    
    @media (max-width: 640px) {
      .container {
        padding: 24px;
      }
      
      h1 {
        font-size: 20px;
      }
      
      .subtitle {
        font-size: 14px;
      }
      
      .divider {
        padding: 0 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    
    <h1>Action Required</h1>
    <p class="subtitle">To use Google Sign-In, please open this link in your phone's default browser</p>
    
    <div class="button-container">
      <!-- Direct link button (primary method) -->
      <a href="${targetUrl}" class="button" target="_top">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Continue to Sign In
      </a>
      
      <!-- Deep link attempts for different browsers -->
      <a href="#" class="button secondary-button" onclick="tryDeepLinks(); return false;">
        Try Opening External Browser
      </a>
    </div>
    
    <div class="divider">
      <span>Manual Instructions</span>
    </div>
    
    <div class="instructions">
      <h2>How to open in your browser:</h2>
      
      <div class="app-instruction">
        <span class="app-name">📘 Facebook / Instagram</span>
        <span class="app-steps">Tap the three dots (⋯) in the top right → Select "Open in Browser"</span>
      </div>
      
      <div class="app-instruction">
        <span class="app-name">🐦 Twitter / X</span>
        <span class="app-steps">Tap the share icon → Select "Open in Safari" or "Open in Chrome"</span>
      </div>
      
      <div class="app-instruction">
        <span class="app-name">💼 LinkedIn</span>
        <span class="app-steps">Tap the three dots (⋯) → Select "Open in external browser"</span>
      </div>
      
      <div class="app-instruction">
        <span class="app-name">📱 Other Apps</span>
        <span class="app-steps">Look for share or menu options → Select "Open in browser"</span>
      </div>
    </div>
    
    <div class="url-section">
      <div class="url-label">Or copy this link:</div>
      <div class="url-display" id="urlDisplay">${targetUrl}</div>
      <button class="copy-button" id="copyButton" onclick="copyUrl()">
        Copy Link to Clipboard
      </button>
    </div>
  </div>

  <script>
    const targetUrl = ${JSON.stringify(targetUrl)};
    const userAgent = navigator.userAgent || '';
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Detect specific in-app browsers
    const isFacebook = /FBAN|FBAV/i.test(userAgent);
    const isInstagram = /Instagram/i.test(userAgent);
    const isTwitter = /Twitter/i.test(userAgent);
    const isLinkedIn = /LinkedInApp/i.test(userAgent);
    
    function tryDeepLinks() {
      const attempts = [];
      
      if (isAndroid) {
        // Android intent URLs
        attempts.push(
          'intent:' + targetUrl + '#Intent;action=android.intent.action.VIEW;scheme=https;package=com.android.chrome;end',
          'intent:' + targetUrl + '#Intent;action=android.intent.action.VIEW;scheme=https;package=com.brave.browser;end',
          'intent:' + targetUrl + '#Intent;action=android.intent.action.VIEW;scheme=https;package=com.microsoft.emmx;end',
          'intent:' + targetUrl + '#Intent;action=android.intent.action.VIEW;scheme=https;end'
        );
      } else if (isIOS) {
        // iOS URL schemes
        const encodedUrl = encodeURIComponent(targetUrl);
        attempts.push(
          'googlechrome://navigate?url=' + encodedUrl,
          'firefox://open-url?url=' + encodedUrl,
          'brave://open-url?url=' + encodedUrl,
          'microsoft-edge-https://' + targetUrl.replace('https://', ''),
          targetUrl // Fallback to direct URL
        );
      }
      
      // Try each attempt with a delay
      attempts.forEach((url, index) => {
        setTimeout(() => {
          console.log('Attempting to open:', url);
          window.location.href = url;
        }, index * 500);
      });
      
      // Final fallback - try window.open
      setTimeout(() => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }, attempts.length * 500);
    }
    
    function copyUrl() {
      const button = document.getElementById('copyButton');
      const urlDisplay = document.getElementById('urlDisplay');
      
      // Create a temporary input element
      const tempInput = document.createElement('input');
      tempInput.value = targetUrl;
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
      
      // Select and copy
      tempInput.select();
      tempInput.setSelectionRange(0, 99999); // For mobile devices
      
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (err) {
        console.error('Copy failed:', err);
      }
      
      document.body.removeChild(tempInput);
      
      if (copied) {
        button.textContent = '✓ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.textContent = 'Copy Link to Clipboard';
          button.classList.remove('copied');
        }, 2500);
      } else {
        // Fallback to modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(targetUrl).then(() => {
            button.textContent = '✓ Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
              button.textContent = 'Copy Link to Clipboard';
              button.classList.remove('copied');
            }, 2500);
          }).catch(err => {
            console.error('Clipboard API failed:', err);
            alert('Please copy the URL manually');
          });
        }
      }
    }
    
    // Auto-redirect attempt on page load
    window.addEventListener('load', function() {
      // Try meta refresh first (already in HTML head)
      
      // Then try JavaScript redirect after a short delay
      setTimeout(() => {
        // For specific apps, try their known methods
        if (isFacebook || isInstagram) {
          // Facebook/Instagram on Android might respond to intent
          if (isAndroid) {
            window.location.href = 'intent:' + targetUrl + '#Intent;action=android.intent.action.VIEW;scheme=https;end';
          }
        } else {
          // For other apps, try direct navigation
          window.location.replace(targetUrl);
        }
      }, 1000);
    });
    
    // Make URL selectable on click
    document.getElementById('urlDisplay').addEventListener('click', function() {
      const range = document.createRange();
      range.selectNodeContents(this);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}