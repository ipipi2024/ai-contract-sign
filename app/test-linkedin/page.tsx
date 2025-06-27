'use client'

import { useEffect, useState } from 'react';

export default function TestLinkedInPage() {
  const [userAgent, setUserAgent] = useState('');
  const [isLinkedIn, setIsLinkedIn] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setUserAgent(ua);
    setIsLinkedIn(ua.includes('LinkedIn') || ua.includes('FBAN') || ua.includes('FBAV'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            LinkedIn Browser Test
          </h1>
          
          <div className="text-left mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>User Agent:</strong>
            </p>
            <p className="text-xs bg-gray-100 p-2 rounded break-all">
              {userAgent}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm">
              <strong>Is LinkedIn Browser:</strong> {isLinkedIn ? 'Yes' : 'No'}
            </p>
          </div>
          
          <div className="space-y-2">
            <a 
              href="/"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Test Homepage Redirect
            </a>
            
            <a 
              href="/auth/signin"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              Test Sign In Redirect
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 