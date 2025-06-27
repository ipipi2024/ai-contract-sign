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
      console.log('In-app browser detected on OAuth path, redirecting to browser opener');
      
      // Get the full URL that should be opened in the browser
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('host') || '';
      const targetUrl = `${protocol}://${host}${pathname}${req.nextUrl.search}`;
      
      // Redirect to the browser opener API
      return NextResponse.redirect(new URL(`/api/open-in-browser?url=${encodeURIComponent(targetUrl)}`, req.url));
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