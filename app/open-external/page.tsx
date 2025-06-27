'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OpenExternalContent() {
  const searchParams = useSearchParams();
  const [attemptedRedirect, setAttemptedRedirect] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const targetUrl = searchParams.get('url') || '/';

  useEffect(() => {
    if (!attemptedRedirect) {
      setAttemptedRedirect(true);
      
      // Try to open in external browser using various methods
      const openInExternalBrowser = () => {
        const userAgent = navigator.userAgent;
        
        // For iOS
        if (/iPhone|iPad|iPod/.test(userAgent)) {
          // Try multiple methods for iOS
          const schemes = [
            `x-web-search://${targetUrl}`,
            `googlechrome://${targetUrl}`,
            `firefox://open-url?url=${encodeURIComponent(targetUrl)}`,
            targetUrl
          ];
          
          schemes.forEach((scheme, index) => {
            setTimeout(() => {
              window.location.href = scheme;
            }, index * 100);
          });
        } 
        // For Android
        else if (/Android/.test(userAgent)) {
          // Try intent URL for Android Chrome
          const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
          window.location.href = intentUrl;
          
          // Fallback to regular URL after a short delay
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 500);
        }
        // Desktop or other
        else {
          window.open(targetUrl, '_blank');
        }
      };
      
      // Attempt redirect
      openInExternalBrowser();
      
      // Start countdown for fallback
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Fallback: redirect to target URL
            window.location.href = targetUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [attemptedRedirect, targetUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Opening DreamSign in your browser...
          </h1>
          
          <p className="text-gray-600 mb-4">
            We're redirecting you to your default browser for the best experience.
          </p>
          
          {countdown > 0 && (
            <p className="text-sm text-gray-500">
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => window.location.href = targetUrl}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Open Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpenExternalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OpenExternalContent />
    </Suspense>
  );
} 