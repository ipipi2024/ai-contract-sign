// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DreamSign - AI-Powered Contract Generation',
  description: 'Create professional, legally-structured contracts in minutes with AI',
  icons: {
    icon: [
      { url: '/images/logo-icon.svg', sizes: '32x32', type: 'image/svg' },
      { url: '/images/logo-icon', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Method 1: Using Script component (Recommended) */}
        <Script
          src="https://cdn.amplitude.com/script/af096c8b3cf2faa18c934f9bf2207133.js"
          strategy="afterInteractive"
        />
        <Script
          id="amplitude-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Wait for Amplitude to load
              if (typeof window !== 'undefined') {
                const initAmplitude = () => {
                  if (window.amplitude) {
                    console.log('Initializing Amplitude...');
                    
                    // Check if sessionReplay exists before trying to use it
                    if (window.sessionReplay && window.sessionReplay.plugin) {
                      console.log('Adding session replay plugin...');
                      window.amplitude.add(window.sessionReplay.plugin({sampleRate: 1}));
                    } else {
                      console.log('Session replay not available, initializing without it');
                    }
                    
                    window.amplitude.init('af096c8b3cf2faa18c934f9bf2207133', {
                      "fetchRemoteConfig": true,
                      "autocapture": true
                    });
                    console.log('Amplitude initialized successfully');
                    
                    // Send a test event to verify it's working
                    window.amplitude.track('Page Viewed', {
                      page: window.location.pathname
                    });
                  } else {
                    // Retry if Amplitude isn't loaded yet
                    console.log('Amplitude not ready, retrying...');
                    setTimeout(initAmplitude, 100);
                  }
                };
                
                // Start initialization after a short delay
                setTimeout(initAmplitude, 500);
              }
            `,
          }}
        />
        
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}