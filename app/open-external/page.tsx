'use client'

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OpenExternalContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get('url') || '/';

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
            Open in Your Browser
          </h1>
          
          <p className="text-gray-600 mb-4">
            To use DreamSign, please open this link in your default browser for the best experience.
          </p>
          
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <p className="text-sm text-gray-500 break-all">
              {targetUrl}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                // Try to copy to clipboard
                navigator.clipboard.writeText(targetUrl).then(() => {
                  alert('Link copied to clipboard! Please paste it in your browser.');
                }).catch(() => {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = targetUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('Link copied to clipboard! Please paste it in your browser.');
                });
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Copy Link
            </button>
            
            <button
              onClick={() => window.location.href = targetUrl}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-colors"
            >
              Try Opening Here
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>💡 Tip: Copy the link and paste it in your browser's address bar</p>
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