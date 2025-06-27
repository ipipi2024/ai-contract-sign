// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
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
        }
        .container {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 400px;
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
        h1 { font-size: 24px; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 5px;
        }
        .hidden { display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h1>Opening in Browser...</h1>
        <p>Redirecting you to your default browser</p>
        
        <div id="manual-buttons" class="hidden">
          <p>If the browser didn't open automatically:</p>
          ${isAndroid ? `
            <a href="intent:${redirectUrl}#Intent;scheme=https;package=com.android.chrome;end" class="button">Open in Chrome</a>
            <a href="intent:${redirectUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end" class="button">Open in Browser</a>
          ` : ''}
          ${isIOS ? `
            <a href="${redirectUrl.replace('https://', 'googlechrome://')}" class="button">Open in Chrome</a>
            <a href="${redirectUrl}" target="_blank" class="button">Open in Safari</a>
          ` : ''}
        </div>
      </div>

      <script>
        const targetUrl = '${redirectUrl}';
        let redirectAttempted = false;
        
        function attemptRedirect() {
          if (redirectAttempted) return;
          redirectAttempted = true;
          
          const isAndroid = ${isAndroid};
          const isIOS = ${isIOS};
          
          if (isAndroid) {
            // Try multiple Android methods
            const methods = [
              // Method 1: Chrome intent
              'intent:' + targetUrl + '#Intent;scheme=https;package=com.android.chrome;end',
              // Method 2: Generic browser intent
              'intent:' + targetUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;end',
              // Method 3: Direct Chrome
              'googlechrome://navigate?url=' + encodeURIComponent(targetUrl)
            ];
            
            let methodIndex = 0;
            function tryNextMethod() {
              if (methodIndex < methods.length) {
                window.location.href = methods[methodIndex];
                methodIndex++;
                setTimeout(tryNextMethod, 500);
              } else {
                // Show manual buttons after all attempts
                document.getElementById('manual-buttons').classList.remove('hidden');
              }
            }
            tryNextMethod();
            
          } else if (isIOS) {
            // iOS methods
            const chromeUrl = targetUrl.replace('https://', 'googlechrome://');
            const firefoxUrl = 'firefox://open-url?url=' + encodeURIComponent(targetUrl);
            
            // Create an invisible iframe to attempt Chrome redirect
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = chromeUrl;
            document.body.appendChild(iframe);
            
            // Try multiple methods with delays
            setTimeout(() => {
              window.location.href = chromeUrl;
            }, 100);
            
            setTimeout(() => {
              // Try opening in new window (sometimes works)
              window.open(targetUrl, '_blank');
            }, 600);
            
            setTimeout(() => {
              // Show manual buttons
              document.getElementById('manual-buttons').classList.remove('hidden');
            }, 1200);
            
          } else {
            // Desktop or unknown - try simple redirect
            window.location.href = targetUrl;
          }
        }
        
        // Start redirect attempts immediately
        attemptRedirect();
        
        // Also try on user interaction (more likely to work)
        document.addEventListener('click', function() {
          if (!redirectAttempted) {
            attemptRedirect();
          }
        });
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}