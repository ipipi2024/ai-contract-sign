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
        const publicPaths = ['/contracts/sign', '/thank-you', '/auth/signin', '/auth/signup', '/auth/error'];

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
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/contracts).*)",
  ],
};

