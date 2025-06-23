// components/dashboard/StatsCards.tsx
import { ContractStats } from '@/types/contracts';
import { StatsCard } from './StatsCard';

interface StatsCardsProps {
  stats: ContractStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Your Contracts"
        value={stats.total}
        icon="documents"
        color="blue"
      />
      <StatsCard
        title="Completed"
        value={stats.completed}
        icon="check"
        color="green"
      />
      <StatsCard
        title="Pending Signature"
        value={stats.pending}
        icon="clock"
        color="yellow"
      />
      <StatsCard
        title="Drafts"
        value={stats.draft}
        icon="pencil"
        color="gray"
      />
    </div>
  );
}
