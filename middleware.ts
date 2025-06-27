import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to detect in-app browsers
function isInAppBrowser(userAgent: string): boolean {
  const inAppBrowserPatterns = [
    /FBAN/i,              // Facebook App
    /FBAV/i,              // Facebook App
    /Instagram/i,         // Instagram
    /Twitter/i,           // Twitter
    /Line/i,              // Line
    /Snapchat/i,          // Snapchat
    /LinkedInApp/i,       // LinkedIn
    /WeChat/i,            // WeChat
    /MicroMessenger/i,    // WeChat
    /WhatsApp/i,          // WhatsApp
    /Telegram/i,          // Telegram
    /TikTok/i,            // TikTok
    /Musical.ly/i,        // TikTok old name
    /Pinterest/i,         // Pinterest
    /reddit/i,            // Reddit
    /Discord/i,           // Discord
    /Slack/i,             // Slack
    // Generic WebView patterns
    /WebView/i,
    /wv/i,
    /\bGSA\b/i,          // Google Search App
  ];

  return inAppBrowserPatterns.some(pattern => pattern.test(userAgent));
}

// Helper function to generate "open in browser" page
function generateOpenInBrowserPage(url: string, userAgent: string): NextResponse {
  // Detect specific app for better instructions
  let appName = "the app";
  let specificInstructions = "";
  
  if (/LinkedInApp/i.test(userAgent)) {
    appName = "LinkedIn";
    specificInstructions = "Tap the three dots (⋯) in the top right corner, then select 'Open in browser'";
  } else if (/FBAN|FBAV/i.test(userAgent)) {
    appName = "Facebook";
    specificInstructions = "Tap the three dots (⋯) menu, then select 'Open in External Browser'";
  } else if (/Instagram/i.test(userAgent)) {
    appName = "Instagram";
    specificInstructions = "Tap the three dots (⋯) in the top right corner, then select 'Open in Browser'";
  } else if (/Twitter/i.test(userAgent)) {
    appName = "Twitter/X";
    specificInstructions = "Tap the share icon, then select 'Open in Safari' (iOS) or 'Open in Browser' (Android)";
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Open in Browser - DreamSign</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f7fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        h1 {
          color: #1a202c;
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .browser-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .browser-icon svg {
          width: 32px;
          height: 32px;
          fill: white;
        }
        .instructions {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .instructions h2 {
          font-size: 16px;
          margin-bottom: 12px;
          color: #374151;
        }
        .instructions ol {
          text-align: left;
          margin: 0;
          padding-left: 20px;
          color: #6b7280;
        }
        .instructions li {
          margin-bottom: 8px;
        }
        .url-box {
          background: #e5e7eb;
          padding: 12px;
          border-radius: 6px;
          word-break: break-all;
          font-size: 14px;
          color: #374151;
          margin-top: 16px;
          user-select: all;
          -webkit-user-select: all;
        }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          margin-top: 16px;
          cursor: pointer;
        }
        .app-specific {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          color: #92400e;
        }
        .copy-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
        }
        .copy-button:hover {
          background: #059669;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a202c;
          }
          .container {
            background: #2d3748;
          }
          h1 {
            color: #f7fafc;
          }
          p {
            color: #e2e8f0;
          }
          .instructions {
            background: #374151;
          }
          .instructions h2 {
            color: #f3f4f6;
          }
          .instructions ol {
            color: #d1d5db;
          }
          .url-box {
            background: #4a5568;
            color: #f7fafc;
          }
          .app-specific {
            background: #7c2d12;
            border-color: #ea580c;
            color: #fef3c7;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="browser-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        
        <h1>Please Open in Your Browser</h1>
        <p>Google Sign-In doesn't work properly inside ${appName}. You need to open this in your regular browser.</p>
        
        ${specificInstructions ? `
        <div class="app-specific">
          <strong>For ${appName}:</strong><br>
          ${specificInstructions}
        </div>
        ` : ''}
        
        <div class="instructions">
          <h2>Step-by-step instructions:</h2>
          <ol>
            <li>Copy the URL below</li>
            <li>Open your browser (Chrome, Safari, etc.)</li>
            <li>Paste the URL in the address bar</li>
            <li>Sign in with Google</li>
          </ol>
        </div>
        
        <p><strong>Copy this URL:</strong></p>
        <div class="url-box" id="urlBox">${url}</div>
        <button class="copy-button" onclick="copyUrl()">Copy URL</button>
        
        <div style="margin-top: 24px;">
          <a href="${url}" class="button" target="_blank" rel="noopener">Try Opening in Browser</a>
        </div>
        
        <script>
          function copyUrl() {
            const urlText = '${url}';
            
            // Try multiple methods to copy
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(urlText).then(() => {
                showCopySuccess();
              }).catch(() => {
                fallbackCopy();
              });
            } else {
              fallbackCopy();
            }
          }
          
          function fallbackCopy() {
            const textArea = document.createElement("textarea");
            textArea.value = '${url}';
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
              document.execCommand('copy');
              showCopySuccess();
            } catch (err) {
              alert('Please manually copy the URL');
            }
            
            document.body.removeChild(textArea);
          }
          
          function showCopySuccess() {
            const button = document.querySelector('.copy-button');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#059669';
            
            setTimeout(() => {
              button.textContent = originalText;
              button.style.background = '#10b981';
            }, 2000);
          }
          
          // Auto-select URL text on click
          document.getElementById('urlBox').addEventListener('click', function() {
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          });
          
          // Try deep linking methods (these often don't work but worth trying)
          setTimeout(() => {
            const userAgent = navigator.userAgent;
            const currentUrl = '${url}';
            
            // For Android, try intent URL with browser package
            if (/android/i.test(userAgent)) {
              // Try opening with Chrome
              const chromeUrl = 'intent://' + currentUrl.replace(/https?:\\/\\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = chromeUrl;
              document.body.appendChild(iframe);
              
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 1000);
            }
            
            // For iOS, try multiple approaches
            if (/iPhone|iPad|iPod/i.test(userAgent)) {
              // Method 1: Try safari-https
              const safariUrl = currentUrl.replace('https://', 'safari-https://');
              const a = document.createElement('a');
              a.href = safariUrl;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              
              setTimeout(() => {
                // Method 2: Try x-web-search (opens Safari search)
                window.location.href = 'x-web-search://?url=' + encodeURIComponent(currentUrl);
              }, 500);
            }
          }, 100);
        </script>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || '';
    
    // Debugging: Log the pathname and user agent
    console.log('Request Path:', pathname);
    console.log('User Agent:', userAgent);
    
    // Check if this is an OAuth-related path and from an in-app browser
    const isOAuthPath = pathname.includes('/auth/signin') || 
                       pathname.includes('/auth/signup') ||
                       pathname.includes('/api/auth/');
    
    if (isOAuthPath && isInAppBrowser(userAgent)) {
      console.log('In-app browser detected on OAuth path, showing redirect page');
      
      // Get the full URL for the user to copy
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('host') || '';
      const fullUrl = `${protocol}://${host}${pathname}${req.nextUrl.search}`;
      
      return generateOpenInBrowserPage(fullUrl, userAgent);
    }
    
    // Define public routes that don't require authentication
    const publicPaths = [
      '/contracts/sign',  // Token-based signing page (accessible by non-users)
      '/thank-you',
      '/auth/signin',
      '/auth/signup',
      '/auth/error',
      '/contracts/help',
      '/',
    ];
    
    // Define public API routes
    const publicApiPaths = [
      '/api/contracts/validate-token',
      '/api/contracts/[id]/sign',
      '/api/contracts/[id]/finalize',
      '/api/contracts/[id]/pdf',
      '/api/contracts/[id]', // For fetching contract in sign page
    ];
    
    // Also allow the old contract/[id]/sign path if needed during transition
    const isDynamicSignPath = /^\/contracts\/[^\/]+\/sign/.test(pathname);
    
    // Check if it's a public page route
    const isPublicPage = publicPaths.some(path => pathname.startsWith(path)) || isDynamicSignPath;
    
    // Check if it's a public API route
    const isPublicApi = publicApiPaths.some(path => {
      const regex = new RegExp('^' + path.replace(/\[.*?\]/g, '[^/]+') + '$');
      return regex.test(pathname);
    });
    
    if (isPublicPage || isPublicApi) {
      // Allow non-authenticated users to access contract signing routes
      return NextResponse.next();
    }
    
    // If the route is not public, ensure authentication
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        
        // Paths that should remain publicly accessible
        const publicPaths = ['/contracts/sign', '/thank-you', '/auth/signin', '/auth/signup', '/auth/error', '/'];
        
        // Check if the current path is a public one
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;  // Allow non-authenticated access
        }
        
        // For other routes, require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - /api/auth/* (NextAuth routes)
     * - /api/contracts/* (public contract API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|\\/api\\/auth|\\/api\\/contracts).*)",
  ],
};