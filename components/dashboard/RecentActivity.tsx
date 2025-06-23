// components/dashboard/RecentActivity.tsx
import Link from 'next/link';
import { Contract } from '@/types/contracts';
import { ContractListItem } from './ContractListItem';

interface RecentActivityProps {
  contracts: Contract[];
}

export function RecentActivity({ contracts }: RecentActivityProps) {
  return (
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

      {contracts.length === 0 ? (
        <p style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          No contracts yet. Create your first contract to get started!
        </p>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <ContractListItem key={contract._id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}