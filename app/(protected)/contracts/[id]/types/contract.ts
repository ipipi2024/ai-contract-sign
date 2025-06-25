export interface Contract {
  _id: string;
  content: string;
  recipientEmail?: string;
  parties?: any[];
  status?: string;
}

export interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
  index: number;
}

export interface ContractBlock {
  text: string;
  signatures: Signature[];
}

export interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  title?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'error';