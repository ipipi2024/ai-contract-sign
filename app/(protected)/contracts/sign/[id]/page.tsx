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
  name?: string;
  date?: string;
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

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessModal = ({ isOpen, onClose, title, message }: SuccessModalProps) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black opacity-50" onClick={handleBackdropClick}></div>
      <div className="relative bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 cursor-pointer"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="ml-3 text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = ({ size = "w-5 h-5" }: { size?: string }) => {
  return (
    <svg className={`${size} animate-spin text-white`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyB"); // Assume recipient is PartyB
  const [error, setError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
  const handleSignatureSave = (blockIndex: number, signatureIndex: number, signatureData: { img_url: string; name: string; date: string }) => {
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
        img_url: signatureData.img_url,
        name: signatureData.name,
        date: signatureData.date
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
      block.signatures && block.signatures.some((s) => s.party === currentParty && s.img_url === "")
    );

    if (hasBlankSignatures) {
      alert("Please sign all your designated signature fields before finalizing.");
      return;
    }

    setIsFinalizing(true);

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
        setShowSuccess(true);
        // Don't redirect immediately, let user see success modal first
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to sign contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      setError('An error occurred while signing. Please try again.');
    } finally {
      setIsFinalizing(false);
    }

    // Send finalized contract email via API route
    if (contract) {
      console.log('Attempting to send finalize email for contract:', contract._id);
      console.log('Recipient email:', contract.recipientEmail);
      console.log('Contract JSON has blocks:', contractJson.blocks.length);
      
      try {
        const finalizeResponse = await fetch(`/api/contracts/${params.id}/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractJson,
            recipientEmail: contract.recipientEmail
          }),
        });

        console.log('Finalize response status:', finalizeResponse.status);

        if (!finalizeResponse.ok) {
          const errorData = await finalizeResponse.json();
          console.error('Finalize email failed:', errorData);
          // Don't block the user flow, but log the error
        } else {
          console.log('Finalize email sent successfully');
        }
      } catch (error) {
        console.error('Error sending finalized contract email:', error);
        // Don't block the user flow if email fails
      }
    } else {
      console.log('No contract found, skipping finalize email');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push('/dashboard');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!contract || !contractJson) return <div className="p-8">Contract not found</div>;

  return (
    <>
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
                disabled={isFinalizing}
                className={`w-full py-4 text-white rounded-md transition text-lg font-semibold flex items-center justify-center ${
                  isFinalizing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-900'
                }`}
              >
                {isFinalizing ? (
                  <>
                    <LoadingSpinner size="w-5 h-5" />
                    <span className="ml-2">Finalizing Contract...</span>
                  </>
                ) : (
                  'Finalize Contract'
                )}
              </button>
              <p className="text-sm text-gray-600 mt-2 text-center">
                By clicking "Finalize Contract", you confirm that you have read and agree to all terms.
              </p>
            </div>

            {/* Signature Modal */}
            {showSignatureFor && (
              <SignatureModal
                onClose={() => setShowSignatureFor(null)}
                onSave={(signatureData: { img_url: string; name: string; date: string }) => {
                  const { blockIndex, signatureIndex } = showSignatureFor;
                  handleSignatureSave(blockIndex, signatureIndex, signatureData);
                  setShowSignatureFor(null);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Contract Finalized Successfully!"
        message="Your contract has been signed and finalized. Both parties will receive a copy via email."
      />
    </>
  );
}