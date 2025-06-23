import { NextResponse } from 'next/server';

export async function GET() {
  // Only enable in development or temporarily in production for debugging
  if (process.env.NODE_ENV === 'production') {
    // Remove this check temporarily for debugging
  }
  
  return NextResponse.json({
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
        `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    currentUrl: process.env.NEXTAUTH_URL,
  });
}