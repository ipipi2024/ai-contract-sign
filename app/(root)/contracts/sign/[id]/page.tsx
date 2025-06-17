'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ContractBlock from '@/components/ContractBlock';
import SignatureModal from '@/components/SignatureModal';
// Removed direct mailer import - will use API route instead

interface Contract {
  _id: string;
  content: string;
  recipientEmail: string;
}

interface Signature {
  party: string;
  img_url: string;
  index: number; // index of the signature in the block
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  assessment: string;
  title?: string;
  type?: string;
  parties?: string[];
}

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyB"); // Assume recipient is PartyB
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
        
        // Parse contract content if it's a string
        let parsedContent;
        if (typeof data.contract.content === 'string') {
          parsedContent = JSON.parse(data.contract.content);
        } else {
          parsedContent = data.contract.content;
        }
        setContractJson(parsedContent);
      } else {
        setError('Failed to load contract');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Error loading contract');
    } finally {
      setLoading(false);
    }
  };

  // Handler to update a signature field
  const handleSignatureSave = (blockIndex: number, signatureIndex: number, img_url: string) => {
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      const block = { ...updatedBlocks[blockIndex] };
      const signatures = [...block.signatures];
      
      if (signatures[signatureIndex].party !== currentParty) {
        console.error(`Signature at index ${signatureIndex} is not for the current party`);
        return prev;
      }

      signatures[signatureIndex] = {
        ...signatures[signatureIndex],
        img_url: img_url
      };

      block.signatures = signatures;
      updatedBlocks[blockIndex] = block;

      return { ...prev, blocks: updatedBlocks };
    });
  };

  // Handler to finalize the contract
  const handleFinalizeContract = async () => {
    if (!contractJson) return;

    // Check if all signatures for current party are completed
    const hasBlankSignatures = contractJson.blocks.some((block) =>
      block.signatures.some((s) => s.party === currentParty && s.img_url === "")
    );

    if (hasBlankSignatures) {
      alert("Please sign all your designated signature fields before finalizing.");
      return;
    }

    try {
      const response = await fetch(`/api/contracts/${params.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractJson: contractJson,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert("Contract signed successfully!");
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to sign contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      setError('An error occurred while signing. Please try again.');
    }

    // Send finalized contract email via API route
    if (contract) {
      try {
        await fetch(`/api/contracts/${params.id}/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractJson,
            recipientEmail: contract.recipientEmail
          }),
        });
      } catch (error) {
        console.error('Error sending finalized contract email:', error);
        // Don't block the user flow if email fails
      }
    }

  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!contract || !contractJson) return <div className="p-8">Contract not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      <div className="flex justify-center px-8 py-6 h-full">
        {/* Contract Display - 7/12 width, centered */}
        <div className="w-7/12 h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="mb-6 bg-white rounded-lg p-6 shadow-md flex-shrink-0">
            <h1 className="text-3xl font-bold mb-2">
              Sign Contract
            </h1>
            <p className="text-gray-600">
              Please review the contract and sign in the designated areas.
            </p>
          </div>

          {/* Error Display - Fixed */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex-shrink-0">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contract Blocks - Scrollable */}
          <div className="flex-1 overflow-y-auto pb-4 pr-2">
            <div className="space-y-2">
              {contractJson.blocks.map((block, i) => (
                <ContractBlock
                  key={i}
                  block={block}
                  blockIndex={i}
                  currentParty={currentParty}
                  onSignatureClick={(signatureIndex: number) => {
                    const signature = block.signatures[signatureIndex];
                    if (signature.party !== currentParty) return;
                    setShowSignatureFor({ blockIndex: i, signatureIndex });
                  }}
                  onRegenerate={() => {}} // Disabled for signing
                  onManualEdit={() => {}} // Disabled for signing
                />
              ))}
            </div>
          </div>

          {/* Finalize Contract Button - Fixed at Bottom */}
          <div className="mt-4 bg-white rounded-lg p-6 shadow-md flex-shrink-0">
            <button
              onClick={handleFinalizeContract}
              className="w-full py-4 bg-black text-white rounded-md hover:bg-gray-900 transition text-lg font-semibold"
            >
              Finalize Contract
            </button>
            <p className="text-sm text-gray-600 mt-2 text-center">
              By clicking "Finalize Contract", you confirm that you have read and agree to all terms.
            </p>
          </div>

          {/* Signature Modal */}
          {showSignatureFor && (
            <SignatureModal
              onClose={() => setShowSignatureFor(null)}
              onSave={(img_url: string) => {
                const { blockIndex, signatureIndex } = showSignatureFor;
                handleSignatureSave(blockIndex, signatureIndex, img_url);
                setShowSignatureFor(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}