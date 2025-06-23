// components/dashboard/ContractListItem.tsx
import Link from 'next/link';
import { Contract } from '@/types/contracts';
import { getStatusIcon } from '@/lib/utils/contract-utils';

interface ContractListItemProps {
  contract: Contract;
}

export function ContractListItem({ contract }: ContractListItemProps) {
  return (
    <Link
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
  );
}