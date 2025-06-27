// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
  // For iOS, we can try to detect specific in-app browsers
  const isFacebookApp = /FBAN|FBAV/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  const isTwitter = /Twitter/i.test(userAgent);
  const isLinkedIn = /LinkedInApp/i.test(userAgent);
  
  // Generate the HTML page that will perform the redirect
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
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
          padding: 20px;
        }
        .container {
          text-align: center;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h1 { 
          font-size: 24px; 
          margin-bottom: 10px;
          color: #333;
        }
        p { 
          color: #666; 
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 8px 4px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .button:hover {
          background: #2980b9;
        }
        .button-secondary {
          background: #7f8c8d;
        }
        .button-secondary:hover {
          background: #5a6c7d;
        }
        .hidden { display: none !important; }
        .url-display {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin: 20px 0;
          word-break: break-all;
          font-family: monospace;
          font-size: 14px;
          color: #555;
          border: 1px solid #e0e0e0;
        }
        .instructions {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          text-align: left;
        }
        .instructions h3 {
          margin: 0 0 10px 0;
          color: #856404;
          font-size: 16px;
        }
        .instructions ol {
          margin: 0;
          padding-left: 20px;
          color: #856404;
        }
        .instructions li {
          margin: 5px 0;
        }
        .copy-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
          transition: background 0.2s;
        }
        .copy-button:hover {
          background: #218838;
        }
        .copy-button.copied {
          background: #6c757d;
        }
        .app-specific {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        .app-specific h4 {
          margin: 0 0 10px 0;
          color: #1976d2;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="loading-section">
          <div class="spinner"></div>
          <h1>Opening in Browser...</h1>
          <p>Attempting to open in your default browser</p>
        </div>
        
        <div id="manual-section" class="hidden">
          <h1>Open in External Browser</h1>
          <p>In-app browsers have limitations. Please follow the instructions below to open this link in your regular browser.</p>
          
          ${isFacebookApp || isInstagram ? `
            <div class="app-specific">
              <h4>${isFacebookApp ? 'Facebook' : 'Instagram'} App Instructions:</h4>
              <ol style="text-align: left; margin: 0; padding-left: 20px;">
                <li>Tap the three dots (⋯) in the top right corner</li>
                <li>Select "Open in External Browser" or "Open in ${isIOS ? 'Safari' : 'Chrome'}"</li>
              </ol>
            </div>
          ` : ''}
          
          ${isTwitter ? `
            <div class="app-specific">
              <h4>Twitter/X App Instructions:</h4>
              <ol style="text-align: left; margin: 0; padding-left: 20px;">
                <li>Tap the share button (↗) at the bottom</li>
                <li>Select "Open in ${isIOS ? 'Safari' : 'Browser'}"</li>
              </ol>
            </div>
          ` : ''}
          
          ${isLinkedIn ? `
            <div class="app-specific">
              <h4>LinkedIn App Instructions:</h4>
              <ol style="text-align: left; margin: 0; padding-left: 20px;">
                <li>Tap the three dots (⋯) in the top right</li>
                <li>Select "Open in external browser"</li>
              </ol>
            </div>
          ` : ''}
          
          <div class="instructions">
            <h3>Manual Steps:</h3>
            <ol>
              <li>Copy the URL below</li>
              <li>Open your preferred browser (${isIOS ? 'Safari, Chrome, Firefox' : 'Chrome, Firefox, Samsung Internet'})</li>
              <li>Paste the URL in the address bar</li>
              <li>Press Enter/Go</li>
            </ol>
          </div>
          
          <div class="url-display" id="url-display">${redirectUrl}</div>
          <button class="copy-button" onclick="copyUrl()">Copy URL</button>
          
          ${isAndroid ? `
            <div style="margin-top: 20px;">
              <p>Alternative methods for Android:</p>
              <a href="${redirectUrl}" target="_blank" class="button">Try Opening Directly</a>
              <a href="googlechrome://navigate?url=${encodeURIComponent(redirectUrl)}" class="button button-secondary">Open in Chrome</a>
            </div>
          ` : ''}
          
          ${isIOS ? `
            <div style="margin-top: 20px;">
              <p>Alternative methods for iOS:</p>
              <a href="${redirectUrl}" target="_blank" rel="noopener noreferrer" class="button">Try Opening Directly</a>
              ${redirectUrl.startsWith('https://') ? `
                <a href="${redirectUrl.replace('https://', 'googlechrome://')}" class="button button-secondary">Try Chrome</a>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <script>
        const targetUrl = '${redirectUrl}';
        let redirectAttempted = false;
        let attemptCount = 0;
        const maxAttempts = 3;
        
        function showManualInstructions() {
          document.getElementById('loading-section').classList.add('hidden');
          document.getElementById('manual-section').classList.remove('hidden');
        }
        
        function copyUrl() {
          const button = event.target;
          const urlText = '${redirectUrl}';
          
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(urlText).then(() => {
              button.textContent = 'Copied!';
              button.classList.add('copied');
              setTimeout(() => {
                button.textContent = 'Copy URL';
                button.classList.remove('copied');
              }, 2000);
            }).catch(() => {
              fallbackCopy(urlText);
            });
          } else {
            fallbackCopy(urlText);
          }
        }
        
        function fallbackCopy(text) {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            event.target.textContent = 'Copied!';
            event.target.classList.add('copied');
            setTimeout(() => {
              event.target.textContent = 'Copy URL';
              event.target.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy');
          }
          
          document.body.removeChild(textArea);
        }
        
        function attemptRedirect() {
          if (redirectAttempted || attemptCount >= maxAttempts) {
            showManualInstructions();
            return;
          }
          
          attemptCount++;
          
          const isAndroid = ${isAndroid};
          const isIOS = ${isIOS};
          
          if (isAndroid) {
            // For Android, try opening in a new tab first
            const newWindow = window.open(targetUrl, '_blank');
            
            if (newWindow) {
              // If window.open worked, we're done
              redirectAttempted = true;
              setTimeout(() => {
                // Check if we're still on the same page
                if (!redirectAttempted) {
                  showManualInstructions();
                }
              }, 2000);
            } else {
              // If blocked, try intent URL
              window.location.href = 'intent:' + targetUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;end';
              
              setTimeout(() => {
                // If we're still here, show manual instructions
                showManualInstructions();
              }, 2000);
            }
            
          } else if (isIOS) {
            // For iOS, window.open is often the most reliable
            const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
            
            if (newWindow) {
              redirectAttempted = true;
              // Show instructions anyway for iOS as behavior varies
              setTimeout(showManualInstructions, 1500);
            } else {
              // Try location.href as fallback
              window.location.href = targetUrl;
              setTimeout(showManualInstructions, 1500);
            }
            
          } else {
            // Desktop or unknown - simple redirect
            window.location.href = targetUrl;
            redirectAttempted = true;
          }
        }
        
        // Don't attempt redirect immediately - wait for page load
        window.addEventListener('load', () => {
          // Give the page a moment to settle
          setTimeout(() => {
            attemptRedirect();
          }, 500);
        });
        
        // If nothing happens after 3 seconds, show manual instructions
        setTimeout(() => {
          if (!redirectAttempted) {
            showManualInstructions();
          }
        }, 3000);
        
        // Also try on user interaction
        document.addEventListener('click', function(e) {
          // Don't interfere with button clicks
          if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
            return;
          }
          
          if (!redirectAttempted && attemptCount < maxAttempts) {
            attemptRedirect();
          }
        });
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 
      'Content-Type': 'text/html',
      // Prevent caching to ensure fresh attempts
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
}