// types/contracts.ts
export interface Contract {
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

export interface ContractStats {
  total: number;
  completed: number;
  pending: number;
  draft: number;
  recentActivity: Contract[];
  awaitingSignature: Contract[];
}