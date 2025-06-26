import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to detect embedded browsers
function isEmbeddedBrowser(userAgent: string): boolean {
  return (
    // Facebook
    userAgent.includes('FBAN') || 
    userAgent.includes('FBAV') ||
    // Instagram
    userAgent.includes('Instagram') ||
    // Twitter
    userAgent.includes('Twitter') ||
    // LinkedIn
    userAgent.includes('LinkedIn') ||
    // Reddit
    userAgent.includes('Reddit') ||
    // TikTok
    userAgent.includes('TikTok') ||
    // Snapchat
    userAgent.includes('Snapchat') ||
    // Pinterest
    userAgent.includes('Pinterest') ||
    // Generic WebView detection
    (userAgent.includes('wv') && userAgent.includes('Android')) ||
    // iOS WebView
    (userAgent.includes('Mobile/') && !userAgent.includes('Safari/'))
  );
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || '';
   
    // Debugging: Log the pathname to ensure we're matching the right routes
    console.log('Request Path:', pathname);
    
    // Check for embedded browser on auth routes FIRST
    if ((pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) && 
        !pathname.startsWith('/auth/browser-redirect')) {
      
      if (isEmbeddedBrowser(userAgent)) {
        // Redirect to browser redirect page
        const redirectUrl = new URL('/auth/browser-redirect', req.url);
        redirectUrl.searchParams.set('intended', pathname + req.nextUrl.search);
        return NextResponse.redirect(redirectUrl);
      }
    }
   
    // Define public routes that don't require authentication
    const publicPaths = [
      '/contracts/sign',  // Token-based signing page (accessible by non-users)
      '/thank-you',
      '/auth/signin',
      '/auth/signup',
      '/auth/error',
      '/auth/browser-redirect', // Add the browser redirect page
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
        const publicPaths = [
          '/contracts/sign', 
          '/thank-you', 
          '/auth/signin', 
          '/auth/signup', 
          '/auth/error',
          '/auth/browser-redirect', // Add the browser redirect page
          '/'
        ];
       
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
     * - /api/auth/* (NextAuth routes) - FIXED: added leading slash
     * - /api/contracts/* (public contract API routes) - FIXED: added leading slash
     */
    "/((?!_next/static|_next/image|favicon.ico|public|\\/api\\/auth|\\/api\\/contracts).*)",
  ],
};