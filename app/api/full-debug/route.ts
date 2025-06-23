import { headers } from 'next/headers';

export async function GET() {
  // Log server-side to Vercel logs
  console.log('Environment check:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
  });

  return Response.json({
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
    allGoogleKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
    processEnvLength: Object.keys(process.env).length,
  });
}