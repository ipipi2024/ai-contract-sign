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


// TypeScript interfaces for contract structure
interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
  index: number; // index of the signature in the block
}

export interface ContractBlock {
  text: string;
  signatures: Signature[];
}

// Updated Party interface to match Mongoose model
export interface Party {
  name: string;
  email?: string;
  role: string;
  signed?: boolean;
  signatureId?: string;
}

// Updated ContractJson interface
export interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  title?: string;
  type?: string;
  parties?: Party[]; // Changed from string[] to Party[]
}
