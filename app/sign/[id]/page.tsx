'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct sign page
    if (params.id) {
      router.replace(`/contracts/sign/${params.id}`);
    }
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign page...</p>
      </div>
    </div>
  );
} 