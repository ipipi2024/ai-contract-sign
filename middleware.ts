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

// Helper function to generate a redirect page that works better
function generateRedirectPage(url: string, userAgent: string): NextResponse {
  // Create a unique URL that will work better with in-app browsers
  const protocol = url.split('://')[0];
  const domain = url.split('://')[1].split('/')[0];
  const path = '/' + url.split('://')[1].split('/').slice(1).join('/');
  
  // Generate browser-specific deep links
  let browserLinks = [];
  
  // For Android
  if (/android/i.test(userAgent)) {
    browserLinks = [
      { name: 'Chrome', url: `googlechrome://navigate?url=${encodeURIComponent(url)}` },
      { name: 'Firefox', url: `firefox://open-url?url=${encodeURIComponent(url)}` },
      { name: 'Opera', url: `opera://open-url?url=${encodeURIComponent(url)}` },
      { name: 'Samsung Internet', url: `samsunginternet://open?url=${encodeURIComponent(url)}` },
    ];
  }
  
  // For iOS
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    browserLinks = [
      { name: 'Safari', url: url.replace('https://', 'x-web-search://?') },
      { name: 'Chrome', url: `googlechrome://${url.replace('https://', '')}` },
      { name: 'Firefox', url: `firefox://open-url?url=${encodeURIComponent(url)}` },
      { name: 'Edge', url: `microsoft-edge-http://${url.replace('https://', '')}` },
    ];
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="0; url=${url}">
      <title>Opening in Browser - DreamSign</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .icon svg {
          width: 40px;
          height: 40px;
          color: #6366f1;
        }
        h1 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        .warning {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .warning-text {
          color: #92400e;
          font-size: 14px;
          font-weight: 600;
        }
        .browser-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .browser-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-decoration: none;
          color: #374151;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }
        .browser-link:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          transform: translateY(-2px);
        }
        .browser-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 8px;
        }
        .url-container {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          position: relative;
        }
        .url-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .url-text {
          font-family: monospace;
          font-size: 14px;
          color: #374151;
          word-break: break-all;
          user-select: all;
          -webkit-user-select: all;
          padding: 12px;
          background: white;
          border-radius: 8px;
          cursor: pointer;
        }
        .copy-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
          transition: background 0.2s;
        }
        .copy-btn:hover {
          background: #4f46e5;
        }
        .copy-btn.success {
          background: #10b981;
        }
        .manual-steps {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .step {
          display: flex;
          align-items: flex-start;
          text-align: left;
          margin-bottom: 16px;
        }
        .step-number {
          background: #e0e7ff;
          color: #6366f1;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          margin-right: 12px;
        }
        .step-text {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.5;
        }
        @media (max-width: 480px) {
          .card { padding: 24px; }
          h1 { font-size: 24px; }
          .browser-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        
        <h1>Open in Your Browser</h1>
        <p class="subtitle">Google Sign-In requires a proper web browser to work securely.</p>
        
        <div class="warning">
          <p class="warning-text">⚠️ You're currently in an in-app browser which doesn't support Google authentication.</p>
        </div>
        
        ${browserLinks.length > 0 ? `
          <p style="margin-bottom: 16px; color: #374151; font-weight: 600;">Quick Links to Browsers:</p>
          <div class="browser-grid">
            ${browserLinks.map(link => `
              <a href="${link.url}" class="browser-link" onclick="trackClick('${link.name}')">
                <div class="browser-icon">
                  ${getBrowserIcon(link.name)}
                </div>
                <span>${link.name}</span>
              </a>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="url-container">
          <div class="url-label">URL to Copy</div>
          <div class="url-text" id="urlText" onclick="selectUrl()">${url}</div>
        </div>
        
        <button class="copy-btn" onclick="copyUrl()">Copy URL to Clipboard</button>
        
        <div class="manual-steps">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #374151;">Manual Steps:</h3>
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">Tap the "Copy URL" button above</div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">Exit this app and open your preferred browser</div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">Paste the URL in the address bar</div>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-text">Complete Google Sign-In</div>
          </div>
        </div>
      </div>
      
      <script>
        function getBrowserIcon(name) {
          const icons = {
            'Safari': '<svg viewBox="0 0 24 24" fill="#007AFF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
            'Chrome': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4"/><circle cx="12" cy="12" r="4" fill="white"/><path d="M12 2L12 12L20.4 7" fill="#DB4437"/><path d="M12 12L3.6 7L3.6 17" fill="#F4B400"/><path d="M12 12L20.4 17L3.6 17" fill="#0F9D58"/></svg>',
            'Firefox': '<svg viewBox="0 0 24 24" fill="#FF6611"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
            'Edge': '<svg viewBox="0 0 24 24" fill="#0078D4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
            'Opera': '<svg viewBox="0 0 24 24" fill="#FF1B2D"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
            'Samsung Internet': '<svg viewBox="0 0 24 24" fill="#6B66FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
          };
          return icons[name] || '<svg viewBox="0 0 24 24" fill="#6B7280"><circle cx="12" cy="12" r="10"/></svg>';
        }
        
        // Replace icon placeholders
        document.querySelectorAll('.browser-icon').forEach(el => {
          const name = el.nextElementSibling.textContent;
          el.innerHTML = getBrowserIcon(name);
        });
        
        function copyUrl() {
          const url = '${url}';
          const button = document.querySelector('.copy-btn');
          
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
              showSuccess();
            }).catch(() => {
              fallbackCopy(url);
            });
          } else {
            fallbackCopy(url);
          }
        }
        
        function fallbackCopy(text) {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            showSuccess();
          } catch (err) {
            prompt('Copy this URL:', text);
          }
          
          document.body.removeChild(textArea);
        }
        
        function showSuccess() {
          const button = document.querySelector('.copy-btn');
          button.textContent = '✓ Copied!';
          button.classList.add('success');
          
          setTimeout(() => {
            button.textContent = 'Copy URL to Clipboard';
            button.classList.remove('success');
          }, 2000);
        }
        
        function selectUrl() {
          const urlText = document.getElementById('urlText');
          const range = document.createRange();
          range.selectNodeContents(urlText);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        function trackClick(browser) {
          console.log('User clicked on', browser, 'link');
          // You can add analytics here
        }
        
        // Auto-attempt redirect after a short delay
        setTimeout(() => {
          // Try a simple redirect first
          window.location.href = '${url}';
        }, 100);
      </script>
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
    
    // Check if the user is forcing to stay in app (for testing)
    const forceInApp = req.nextUrl.searchParams.get('force_in_app') === 'true';
    
    if (isOAuthPath && isInAppBrowser(userAgent) && !forceInApp) {
      console.log('In-app browser detected on OAuth path, showing redirect page');
      
      // Get the full URL for the user to copy
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('host') || '';
      const fullUrl = `${protocol}://${host}${pathname}${req.nextUrl.search}`;
      
      return generateRedirectPage(fullUrl, userAgent);
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