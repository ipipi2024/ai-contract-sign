import { NextResponse } from 'next/server';

export async function GET() {
  // Only enable in development or temporarily in production for debugging
  if (process.env.NODE_ENV === 'production') {
    // Remove this check temporarily for debugging
  }

  // Get all environment variables starting with common prefixes
  const allEnvVars = {};
  Object.keys(process.env).forEach(key => {
    // Only show environment variables that are commonly used in Next.js apps
    // or match common patterns to avoid exposing sensitive system variables
    if (
      key.startsWith('NEXT_') ||
      key.startsWith('NEXTAUTH_') ||
      key.startsWith('GOOGLE_') ||
      key.startsWith('DATABASE_') ||
      key.startsWith('VERCEL_') ||
      key === 'NODE_ENV' ||
      key === 'TEST_KEY' ||
      key.includes('CLIENT') ||
      key.includes('SECRET') ||
      key.includes('KEY') ||
      key.includes('URL') ||
      key.includes('HOST') ||
      key.includes('PORT')
    ) {
      // Mask sensitive values but show if they're set
      if (key.includes('SECRET') || key.includes('PRIVATE') || (key.includes('KEY') && !key.includes('PUBLIC'))) {
        allEnvVars[key] = process.env[key] ? 'SET (masked)' : 'NOT SET';
      } else if (key.includes('CLIENT_ID') || key.includes('PUBLIC')) {
        // Show partial value for client IDs and public keys
        allEnvVars[key] = process.env[key] 
          ? `${process.env[key].substring(0, 10)}...` 
          : 'NOT SET';
      } else {
        // Show full value for non-sensitive variables
        allEnvVars[key] = process.env[key] || 'NOT SET';
      }
    }
  });

  return NextResponse.json({
    // Your original specific env checks
    specificEnv: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID 
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` 
        : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      TEST_KEY: process.env.TEST_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
    
    // All relevant environment variables
    allRelevantEnv: allEnvVars,
    
    // Debugging info
    debug: {
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      currentUrl: process.env.NEXTAUTH_URL,
      totalEnvVars: Object.keys(process.env).length,
      relevantEnvVars: Object.keys(allEnvVars).length,
    },
    
    // Check if critical variables are missing
    missingCriticalVars: [
      !process.env.GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID',
      !process.env.GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET',
      !process.env.NEXTAUTH_SECRET && 'NEXTAUTH_SECRET',
      !process.env.NEXTAUTH_URL && 'NEXTAUTH_URL',
      !process.env.TEST_KEY && 'TEST_KEY',
    ].filter(Boolean),
  });
}