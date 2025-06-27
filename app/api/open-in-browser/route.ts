// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform and specific apps
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isFacebookApp = /FBAN|FBAV|FB_IAB|FBIOS/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  
  // Method 1: For Android Facebook/Instagram - Use download attribute trick
  if (isAndroid && (isFacebookApp || isInstagram)) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting...</title>
      </head>
      <body>
        <a id="redirect-link" href="${redirectUrl}" download style="display:none;">Redirecting...</a>
        <script>
          // Immediately click the download link
          document.getElementById('redirect-link').click();
          
          // Also try direct navigation
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 100);
        </script>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // Method 2: For iOS - Use a combination of techniques
  if (isIOS) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting...</title>
        <style>
          body { margin: 0; padding: 0; }
          .redirect-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
          }
        </style>
      </head>
      <body>
        <div class="redirect-container">
          <!-- Method 1: Window.location with user gesture -->
          <script>
            const targetUrl = '${redirectUrl}';
            
            // Create invisible full-screen button
            const button = document.createElement('a');
            button.href = targetUrl;
            button.style.position = 'fixed';
            button.style.top = '0';
            button.style.left = '0';
            button.style.width = '100%';
            button.style.height = '100%';
            button.style.opacity = '0';
            button.style.zIndex = '999999';
            document.body.appendChild(button);
            
            // Auto-click after minimal delay
            setTimeout(() => {
              button.click();
            }, 10);
            
            // Also try direct navigation
            window.location.replace(targetUrl);
          </script>
          
          <!-- Method 2: Meta refresh fallback -->
          <meta http-equiv="refresh" content="0; url=${redirectUrl}">
          
          <!-- Method 3: JavaScript location variants -->
          <script>
            // Try multiple location methods
            try {
              window.location.href = '${redirectUrl}';
              window.location.assign('${redirectUrl}');
              window.location = '${redirectUrl}';
            } catch (e) {}
            
            // For Instagram/Facebook specifically
            if (navigator.userAgent.match(/Instagram|FBAN|FBAV/i)) {
              // Try opening in Safari
              window.location.href = 'x-safari-' + '${redirectUrl}'.replace(/^https?:/, '');
              
              // Try FTP protocol trick
              setTimeout(() => {
                window.location.href = 'ftp://' + '${redirectUrl}'.replace(/^https?:\\/\\//, '');
              }, 50);
            }
          </script>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // Method 3: Generic/Desktop approach with all techniques combined
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="0; url=${redirectUrl}">
      <title>Redirecting...</title>
      <script type="text/javascript">
        // Immediate redirect attempts
        window.location.replace('${redirectUrl}');
      </script>
    </head>
    <body>
      <script>
        const targetUrl = '${redirectUrl}';
        
        // Try all methods
        function redirect() {
          // Method 1: location.href
          window.location.href = targetUrl;
          
          // Method 2: location.replace
          window.location.replace(targetUrl);
          
          // Method 3: location.assign  
          window.location.assign(targetUrl);
          
          // Method 4: Create and click link
          const a = document.createElement('a');
          a.href = targetUrl;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          // Method 5: window.open
          window.open(targetUrl, '_self');
        }
        
        // Execute immediately
        redirect();
        
        // Try on DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', redirect);
        }
        
        // Try on window load
        window.addEventListener('load', redirect);
        
        // Android-specific: Intent URLs
        if (navigator.userAgent.match(/Android/i)) {
          setTimeout(() => {
            window.location.href = 'intent:' + targetUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
          }, 100);
        }
      </script>
      
      <!-- Fallback link -->
      <noscript>
        <meta http-equiv="refresh" content="0; url=${redirectUrl}">
      </noscript>
      
      <!-- Hidden iframes for additional attempts -->
      <iframe src="${redirectUrl}" style="width:0;height:0;border:0;display:none;"></iframe>
      
      <!-- Minimal UI -->
      <div style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:20px;">
        <p>Redirecting...</p>
        <p style="font-size:12px;color:#666;">If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
      </div>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Add header that some in-app browsers respect
      'X-Frame-Options': 'DENY',
    },
  });
}