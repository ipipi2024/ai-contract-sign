import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

// Main middleware function that handles browser detection first
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';
  
  console.log('Request Path:', pathname);
  console.log('User Agent:', userAgent);
  
  // FIRST: Check for embedded browser on auth routes
  if ((pathname === '/auth/signin' || pathname === '/auth/signup') && 
      !pathname.startsWith('/auth/browser-redirect')) {
    
    if (isEmbeddedBrowser(userAgent)) {
      console.log('Embedded browser detected, redirecting...');
      const redirectUrl = new URL('/auth/browser-redirect', req.url);
      redirectUrl.searchParams.set('intended', pathname + req.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }
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
    '/api/contracts/validate-token',
    '/api/contracts/[id]/sign',
    '/api/contracts/[id]/finalize',
    '/api/contracts/[id]/pdf',
    '/api/contracts/[id]',
    '/api/auth', // Auth API routes
  ];
  
  // Check if it's a public route
  const isDynamicSignPath = /^\/contracts\/[^\/]+\/sign/.test(pathname);
  const isPublicPage = publicPaths.some(path => pathname.startsWith(path)) || isDynamicSignPath;
  const isPublicApi = publicApiPaths.some(path => {
    if (path.includes('[')) {
      const regex = new RegExp('^' + path.replace(/\[.*?\]/g, '[^/]+') + '$');
      return regex.test(pathname);
    }
    return pathname.startsWith(path);
  });
  
  // Allow public routes
  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // Not authenticated, redirect to sign in
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
     * - API routes that should bypass middleware
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};