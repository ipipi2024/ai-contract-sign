// middleware.ts
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
    // Additional patterns
    /FB_IAB/i,            // Facebook In-App Browser
    /FBIOS/i,             // Facebook iOS
    /FBBR/i,              // Facebook Browser
    /TwitterAndroid/i,    // Twitter Android
    /Instagram.*Android/i, // Instagram Android
    /KAKAOTALK/i,         // KakaoTalk
    /NAVER/i,             // Naver
    /Flipboard/i,         // Flipboard
    /Linkedin/i,          // LinkedIn (alternate)
    /baiduboxapp/i,       // Baidu
    /baidubrowser/i,      // Baidu Browser
    /SamsungBrowser/i,    // Samsung Internet (sometimes acts like in-app)
  ];

  return inAppBrowserPatterns.some(pattern => pattern.test(userAgent));
}

// Helper to check if we should redirect this path
function shouldRedirectPath(pathname: string): boolean {
  // Always redirect OAuth paths and main app pages from in-app browsers
  const protectedPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/dashboard',
    '/contracts',
    '/api/auth/signin',
    '/api/auth/callback',
    '/api/auth/session',
  ];
  
  // Check if it's a protected path or the root when it might lead to auth
  return protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/';
}

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent') || '';
    
    // Skip middleware for the open-in-browser API itself
    if (pathname === '/api/open-in-browser') {
      return NextResponse.next();
    }
    
    // Check if user is forcing to stay in app (for testing)
    const forceInApp = req.nextUrl.searchParams.get('force_in_app') === 'true';
    
    // Check if it's from an in-app browser and should be redirected
    if (isInAppBrowser(userAgent) && shouldRedirectPath(pathname) && !forceInApp) {
      console.log('In-app browser detected, redirecting to browser opener');
      console.log('User Agent:', userAgent);
      console.log('Path:', pathname);
      
      // Construct the full URL
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('host') || '';
      const targetUrl = `${protocol}://${host}${pathname}${req.nextUrl.search}`;
      
      // Add a flag to prevent redirect loops
      const url = new URL(`/api/open-in-browser`, req.url);
      url.searchParams.set('url', targetUrl);
      
      return NextResponse.redirect(url);
    }
    
    // Define public routes that don't require authentication
    const publicPaths = [
      '/contracts/sign',
      '/thank-you',
      '/auth/signin',
      '/auth/signup',
      '/auth/error',
      '/contracts/help',
      '/',
      '/api/open-in-browser', // Add this to public paths
    ];
    
    // Define public API routes
    const publicApiPaths = [
      '/api/contracts/validate-token',
      '/api/contracts/[id]/sign',
      '/api/contracts/[id]/finalize',
      '/api/contracts/[id]/pdf',
      '/api/contracts/[id]',
      '/api/open-in-browser', // Add this as well
    ];
    
    // Check for dynamic sign path
    const isDynamicSignPath = /^\/contracts\/[^\/]+\/sign/.test(pathname);
    
    // Check if it's a public page route
    const isPublicPage = publicPaths.some(path => pathname.startsWith(path)) || isDynamicSignPath;
    
    // Check if it's a public API route
    const isPublicApi = publicApiPaths.some(path => {
      const regex = new RegExp('^' + path.replace(/\[.*?\]/g, '[^/]+') + '$');
      return regex.test(pathname);
    });
    
    if (isPublicPage || isPublicApi) {
      return NextResponse.next();
    }
    
    // For authenticated routes, continue with auth check
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public paths
        const publicPaths = [
          '/contracts/sign',
          '/thank-you',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/',
          '/api/open-in-browser',
        ];
        
        // Allow public paths
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }
        
        // Require authentication for other routes
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
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};