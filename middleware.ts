import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    
    // Debugging: Log the pathname to ensure we're matching the right routes
    console.log('Request Path:', pathname);
    
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
    
    // Define public API routes (excluding auth routes)
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
    
    // Allow NextAuth routes to pass through
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    if (isPublicPage || isPublicApi) {
      // Allow non-authenticated users to access contract signing routes
      return NextResponse.next();
    }
    
    // If not authenticated and trying to access protected route
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This is called before the middleware function above
        // Return true to allow the middleware to continue
        // Return false to redirect to sign in
        return true; // Let the middleware function handle the logic
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