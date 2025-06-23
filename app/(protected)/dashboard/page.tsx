// app/dashboard/contracts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ContractStats } from '@/types/contracts';
import { fetchContractStats } from '@/lib/api/contracts';
import { LoadingState } from '@/components/dashboard/LoadingState';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AwaitingSignature } from '@/components/dashboard/AwaitingSignature';

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
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadContractStats();
    }
  }, [status, session]);

  const loadContractStats = async () => {
    try {
      setError(null);
      const stats = await fetchContractStats(session?.user?.email || '', router);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return <LoadingState />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadContractStats} />;
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <WelcomeHeader userName={session?.user?.name} />
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity contracts={stats.recentActivity} />
        <AwaitingSignature contracts={stats.awaitingSignature} />
      </div>
    </div>
  );
}
