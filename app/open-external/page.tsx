'use client'

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OpenExternalContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get('url') || '/';

  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            TEST PAGE - OPEN EXTERNAL
          </h1>
          
          <p className="text-gray-600 mb-4">
            If you can see this, the page is loading correctly!
          </p>
          
          <div className="bg-yellow-100 rounded-md p-3 mb-4">
            <p className="text-sm text-gray-700 break-all">
              Target URL: {targetUrl}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                alert('Button clicked! URL: ' + targetUrl);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Test Button
            </button>
            
            <button
              onClick={() => window.location.href = targetUrl}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              Go to Target URL
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>This is a test page to debug the LinkedIn redirect issue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpenExternalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
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