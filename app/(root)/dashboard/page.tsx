'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Contract {
  _id: string;
  title: string;
  parties: Array<{
    name: string;
    email: string;
    role: string;
    signed: boolean;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByEmail?: string;
}

interface ContractStats {
  total: number;
  completed: number;
  pending: number;
  draft: number;
  recentActivity: Contract[];
  awaitingSignature: Contract[];
}

export default function DashboardContractsView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    completed: 0,
    pending: 0,
    draft: 0,
    recentActivity: [],
    awaitingSignature: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch contracts if authenticated
    if (status === 'authenticated' && session?.user) {
      fetchContractStats();
    }
  }, [status, session]);

  const fetchContractStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/contracts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      const contracts: Contract[] = data.contracts || [];

      // Filter for contracts where the current user hasn't signed yet
      const userEmail = session?.user?.email;
      const contractsAwaitingMySignature = contracts.filter(contract => {
        const myParty = contract.parties.find(p => p.email === userEmail);
        return contract.status === 'pending' && myParty && !myParty.signed;
      });

      // Calculate statistics
      const stats: ContractStats = {
        total: contracts.length,
        completed: contracts.filter(c => c.status === 'completed').length,
        pending: contracts.filter(c => c.status === 'pending').length,
        draft: contracts.filter(c => c.status === 'draft').length,
        recentActivity: contracts.slice(0, 5), // Top 5 most recent
        awaitingSignature: contractsAwaitingMySignature.slice(0, 3) // Top 3 awaiting user's signature
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="animate-pulse p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Don't render anything if unauthenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
        <button
          onClick={fetchContractStats}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      {/* Welcome message with user name */}
      {session?.user?.name && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Welcome back, {session.user.name}!
          </h2>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Here's your contract overview
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Your Contracts
              </p>
              <p className="text-2xl font-semibold mt-2" style={{ color: 'var(--foreground)' }}>
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
             <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                <path d="M8 7h4v2H8V7zm0 4h4v2H8v-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Completed
              </p>
              <p className="text-2xl font-semibold mt-2" style={{ color: 'var(--foreground)' }}>
                {stats.completed}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Pending Signature
              </p>
              <p className="text-2xl font-semibold mt-2" style={{ color: 'var(--foreground)' }}>
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Drafts
              </p>
              <p className="text-2xl font-semibold mt-2" style={{ color: 'var(--foreground)' }}>
                {stats.draft}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Recent Activity
            </h3>
            <Link 
              href="/contracts" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              View all →
            </Link>
          </div>

          {stats.recentActivity.length === 0 ? (
            <p style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              No contracts yet. Create your first contract to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((contract) => (
                <Link
                  key={contract._id}
                  href={`/contracts/${contract._id}`}
                  className="block p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(contract.status)}
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {contract.title}
                        </p>
                        <p 
                          className="text-xs mt-1"
                          style={{ color: 'var(--foreground)', opacity: 0.5 }}
                        >
                          {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span 
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(128, 128, 128, 0.1)',
                        color: 'var(--foreground)',
                        opacity: 0.7
                      }}
                    >
                      {contract.parties.filter(p => p.signed).length}/{contract.parties.length} signed
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Awaiting Your Signature */}
        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Awaiting Your Signature
            </h3>
            <Link 
              href="/contracts?filter=pending" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              View all →
            </Link>
          </div>

          {stats.awaitingSignature.length === 0 ? (
            <p style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              No contracts awaiting your signature
            </p>
          ) : (
            <div className="space-y-4">
              {stats.awaitingSignature.map((contract) => (
                <div
                  key={contract._id}
                  className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {contract.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--foreground)', opacity: 0.7 }}
                    >
                      Action required
                    </p>
                    <Link
                      href={`/contracts/${contract._id}`}
                      className="text-sm px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Review & Sign
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}