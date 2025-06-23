// lib/api/contracts.ts
import { Contract, ContractStats } from '@/types/contracts';

export async function fetchContractStats(
  userEmail: string,
  router: any
): Promise<ContractStats> {
  const response = await fetch('/api/contracts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      router.push('/auth/signin');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch contracts');
  }

  const data = await response.json();
  const contracts: Contract[] = data.contracts || [];

  const contractsAwaitingMySignature = contracts.filter(contract => {
    const myParty = contract.parties.find(p => p.email === userEmail);
    return contract.status === 'pending' && myParty && !myParty.signed;
  });

  return {
    total: contracts.length,
    completed: contracts.filter(c => c.status === 'completed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    draft: contracts.filter(c => c.status === 'draft').length,
    recentActivity: contracts.slice(0, 5),
    awaitingSignature: contractsAwaitingMySignature.slice(0, 3)
  };
}
