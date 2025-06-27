// app/api/open-in-browser/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get('url') || '/';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect platform and specific apps
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isFacebookApp = /FBAN|FBAV|FB_IAB/i.test(userAgent);
  const isInstagram = /Instagram/i.test(userAgent);
  const isTwitter = /Twitter/i.test(userAgent);
  const isLinkedIn = /LinkedInApp/i.test(userAgent);
  const isTikTok = /TikTok|Musical.ly/i.test(userAgent);
  
  // For immediate redirect on iOS apps
  if (isIOS && (isFacebookApp || isInstagram || isTwitter || isLinkedIn || isTikTok)) {
    // Use a data URI redirect which works in many iOS in-app browsers
    const dataUri = `data:text/html,<html><head><meta http-equiv="refresh" content="0; url=${encodeURIComponent(redirectUrl)}"></head><body></body></html>`;
    return NextResponse.redirect(dataUri);
  }
  
  // Generate the HTML page with aggressive redirect attempts
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="0; url=${redirectUrl}">
      <title>Redirecting...</title>
      <script>
        // Immediate execution - no waiting
        (function() {
          const targetUrl = '${redirectUrl}';
          
          // Method 1: Immediate location change
          window.location.replace(targetUrl);
          
          // Method 2: Also try href
          window.location.href = targetUrl;
          
          // Method 3: Try location assign
          window.location.assign(targetUrl);
        })();
      </script>
    </head>
    <body>
      <script>
        const targetUrl = '${redirectUrl}';
        const isAndroid = ${isAndroid};
        const isIOS = ${isIOS};
        const isFacebookApp = ${isFacebookApp};
        const isInstagram = ${isInstagram};
        const isTwitter = ${isTwitter};
        const isLinkedIn = ${isLinkedIn};
        const isTikTok = ${isTikTok};
        
        // Aggressive redirect function
        function forceRedirect() {
          if (isAndroid) {
            // Android methods in order of effectiveness
            
            // Method 1: Intent with fallback browser
            const intentUrl = 'intent:' + targetUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
            window.location.href = intentUrl;
            
            // Method 2: Try Chrome specifically after a tiny delay
            setTimeout(() => {
              window.location.href = 'googlechrome://navigate?url=' + encodeURIComponent(targetUrl);
            }, 100);
            
            // Method 3: Samsung Internet
            setTimeout(() => {
              window.location.href = 'samsunginternet://open?url=' + encodeURIComponent(targetUrl);
            }, 200);
            
            // Method 4: Generic intent
            setTimeout(() => {
              window.location.href = 'intent://' + targetUrl.replace(/^https?:\\/\\//, '') + '#Intent;scheme=https;action=android.intent.action.VIEW;end';
            }, 300);
            
          } else if (isIOS) {
            // iOS methods
            
            // Method 1: Use the x-callback-url for specific apps
            if (isFacebookApp || isInstagram) {
              // Facebook/Instagram specific
              window.location.href = 'fb://facewebmodal/f?href=' + encodeURIComponent(targetUrl);
              setTimeout(() => {
                window.location.href = targetUrl;
              }, 50);
            } else if (isTwitter) {
              // Twitter specific
              window.location.href = 'twitter://timeline?url=' + encodeURIComponent(targetUrl);
              setTimeout(() => {
                window.location.href = targetUrl;
              }, 50);
            } else if (isLinkedIn) {
              // LinkedIn specific
              window.location.href = 'linkedin://openurl?url=' + encodeURIComponent(targetUrl);
              setTimeout(() => {
                window.location.href = targetUrl;
              }, 50);
            } else {
              // Generic iOS approach
              
              // Try Chrome
              const chromeUrl = targetUrl.replace(/^https:\\/\\//, 'googlechrome://');
              window.location.href = chromeUrl;
              
              // Try Safari via FTP trick (works in some apps)
              setTimeout(() => {
                window.location.href = 'ftp://' + targetUrl.replace(/^https?:\\/\\//, '');
              }, 100);
              
              // Try x-web-search protocol
              setTimeout(() => {
                window.location.href = 'x-web-search://?url=' + encodeURIComponent(targetUrl);
              }, 200);
              
              // Final attempt with target=_blank
              setTimeout(() => {
                const a = document.createElement('a');
                a.href = targetUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
              }, 300);
            }
          }
          
          // Universal fallback: Create and click invisible link
          const link = document.createElement('a');
          link.href = targetUrl;
          link.target = '_top'; // Try _top instead of _blank
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // Try clicking it multiple times
          for (let i = 0; i < 3; i++) {
            setTimeout(() => link.click(), i * 100);
          }
          
          // Try window.open as last resort
          setTimeout(() => {
            window.open(targetUrl, '_blank');
          }, 400);
        }
        
        // Execute immediately
        forceRedirect();
        
        // Try again on any interaction
        document.addEventListener('touchstart', forceRedirect, { once: true });
        document.addEventListener('click', forceRedirect, { once: true });
        
        // For apps that need a user gesture, create invisible full-screen div
        const tapDiv = document.createElement('div');
        tapDiv.style.position = 'fixed';
        tapDiv.style.top = '0';
        tapDiv.style.left = '0';
        tapDiv.style.width = '100%';
        tapDiv.style.height = '100%';
        tapDiv.style.zIndex = '9999';
        tapDiv.style.background = 'transparent';
        tapDiv.onclick = forceRedirect;
        document.body.appendChild(tapDiv);
        
        // Remove the div after a second
        setTimeout(() => {
          if (tapDiv.parentNode) {
            tapDiv.parentNode.removeChild(tapDiv);
          }
        }, 1000);
      </script>
      
      <!-- Minimal loading indicator -->
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,-apple-system,sans-serif;">
        <div style="text-align:center;">
          <div style="width:40px;height:40px;border:3px solid #f3f3f3;border-top:3px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;"></div>
          <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
        </div>
      </div>
      
      <!-- Multiple redirect attempts in HTML -->
      <iframe src="${redirectUrl}" style="display:none;"></iframe>
      <iframe src="googlechrome://navigate?url=${encodeURIComponent(redirectUrl)}" style="display:none;"></iframe>
      ${isAndroid ? `<iframe src="intent:${redirectUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end" style="display:none;"></iframe>` : ''}
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
}