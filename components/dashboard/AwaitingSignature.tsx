// components/dashboard/AwaitingSignature.tsx
import Link from 'next/link';
import { Contract } from '@/types/contracts';

interface AwaitingSignatureProps {
  contracts: Contract[];
}

export function AwaitingSignature({ contracts }: AwaitingSignatureProps) {
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
          Awaiting Your Signature
        </h3>
        <Link 
          href="/contracts?filter=pending" 
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          View all →
        </Link>
      </div>

      {contracts.length === 0 ? (
        <p style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          No contracts awaiting your signature
        </p>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
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
  );
}
