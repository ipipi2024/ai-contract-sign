import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Helper function to detect embedded browsers
function isEmbeddedBrowser(userAgent: string): boolean {
  const embedded = (
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
  
  console.log('User Agent:', userAgent);
  console.log('Is Embedded:', embedded);
  
  return embedded;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';
  
  console.log('=== Middleware Check ===');
  console.log('Path:', pathname);
  
  // Skip browser redirect page itself
  if (pathname === '/auth/browser-redirect') {
    return NextResponse.next();
  }
  
  // Define public routes that don't require authentication
  const publicPaths = [
    '/contracts/sign',
    '/thank-you',
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/browser-redirect',
    '/contracts/help',
    '/',
  ];
  
  // Define public API routes
  const publicApiPaths = [
    '/api/contracts',
    '/api/auth',
  ];
  
  // Check if it's a public route
  const isDynamicSignPath = /^\/contracts\/[^\/]+\/sign/.test(pathname);
  const isPublicPage = publicPaths.some(path => pathname.startsWith(path)) || isDynamicSignPath;
  const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path));
  
  // If it's a public route, check for embedded browser
  if (isPublicPage || isPublicApi) {
    // Check for embedded browser on auth routes
    if ((pathname === '/auth/signin' || pathname === '/auth/signup') && isEmbeddedBrowser(userAgent)) {
      console.log('Embedded browser on auth page, redirecting...');
      const redirectUrl = new URL('/auth/browser-redirect', req.url);
      redirectUrl.searchParams.set('intended', pathname + req.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }
  
  // For protected routes, check if user is authenticated
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // Not authenticated - check if it's an embedded browser BEFORE redirecting to signin
    if (isEmbeddedBrowser(userAgent)) {
      console.log('Embedded browser on protected route, redirecting to browser-redirect...');
      // Redirect to browser-redirect page with the original intended URL
      const redirectUrl = new URL('/auth/browser-redirect', req.url);
      redirectUrl.searchParams.set('intended', pathname + req.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Normal browser, redirect to signin
    console.log('Not authenticated, redirecting to signin...');
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (e.g., .css, .js, .png)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\..*|_next).*)",
  ],
};