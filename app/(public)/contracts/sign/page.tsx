//app/(public)/contracts/sign/page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContractBlock from '@/components/ContractBlock';
import SignatureModal from '@/components/SignatureModal';

interface Contract {
  _id: string;
  content: string;
  recipientEmail: string;
}

interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
  index: number;
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

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal = ({ isOpen, onClose, title, message }: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = ({ size = "w-5 h-5" }: { size?: string }) => {
  return (
    <svg className={`${size} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

// Extract the main component logic into a separate component
function SignContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyB");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (token) {
      validateTokenAndFetchContract();
    } else {
      setError({
        title: "Missing Token",
        message: "No signing token provided. Please use the link from your email."
      });
      setLoading(false);
    }
  }, [token]);

  const validateTokenAndFetchContract = async () => {
    try {
      // First validate the token
      const tokenResponse = await fetch('/api/contracts/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        setError({
          title: "Invalid Token",
          message: errorData.error || 'The signing link is invalid or has expired.'
        });
        setLoading(false);
        return;
      }

      const tokenData = await tokenResponse.json();
      setTokenValid(true);
      setContractId(tokenData.contractId);
      setCurrentParty(tokenData.party);
      setRecipientEmail(tokenData.recipientEmail);

      // Now fetch the contract
      const contractResponse = await fetch(`/api/contracts/${tokenData.contractId}`);
      if (contractResponse.ok) {
        const data = await contractResponse.json();
        setContract(data.contract);
        
        let parsedContent;
        if (typeof data.contract.content === 'string') {
          parsedContent = JSON.parse(data.contract.content);
        } else {
          parsedContent = data.contract.content;
        }
        setContractJson(parsedContent);
      } else {
        setError({
          title: "Contract Not Found",
          message: "Failed to load the contract. Please contact the sender."
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError({
        title: "Error",
        message: "An error occurred while loading the contract. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

// Updated handleSignatureSave function for /app/(public)/contracts/sign/page.tsx

const handleSignatureSave = async (blockIndex: number, signatureIndex: number, signatureData: { img_url: string; name: string; date: string }) => {
  if (!contractJson || !contractId) return;

  // Update local state first
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

  // Update in database
  try {
    const updatedContractJson = { ...contractJson };
    const updatedBlocks = [...updatedContractJson.blocks];
    const block = { ...updatedBlocks[blockIndex] };
    const signatures = [...block.signatures];
    
    signatures[signatureIndex] = {
      ...signatures[signatureIndex],
      img_url: signatureData.img_url,
      name: signatureData.name,
      date: signatureData.date
    };
    
    block.signatures = signatures;
    updatedBlocks[blockIndex] = block;
    updatedContractJson.blocks = updatedBlocks;

    // First, fetch the current contract to get parties information
    const contractResponse = await fetch(`/api/contracts/${contractId}`);
    if (!contractResponse.ok) {
      throw new Error('Failed to fetch contract');
    }
    
    const { contract: currentContract } = await contractResponse.json();
    
    // Update parties array
    let updatedParties = currentContract.parties || [];
    const partyIndex = updatedParties.findIndex((party: any) => 
      party.role === (currentParty === 'PartyA' ? 'Disclosing Party' : 'Receiving Party') ||
      party.name === signatureData.name ||
      party.email === recipientEmail
    );
    
    if (partyIndex !== undefined && partyIndex >= 0) {
      updatedParties[partyIndex] = {
        ...updatedParties[partyIndex],
        signed: true,
        signatureId: `${blockIndex}-${signatureIndex}`,
        signedAt: new Date().toISOString()
      };
    }
    
    const allPartiesSigned = updatedParties.every((party: any) => party.signed);
    const newStatus = allPartiesSigned ? 'completed' : 'pending';
    
    // Update the contract with new content, parties, and status
    const updateResponse = await fetch(`/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: JSON.stringify(updatedContractJson),
        parties: updatedParties,
        status: newStatus
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update contract');
    }
    
  } catch (error) {
    console.error('Error updating contract:', error);
    setError({
      title: "Failed to Save Signature",
      message: "Failed to save signature. Please try again."
    });
  }
};

 const handleFinalizeContract = async () => {
  if (!contractJson || !contractId || isFinalizing) return;

  const hasBlankSignatures = contractJson.blocks.some((block) =>
    block.signatures.some((s) => s.party === currentParty && s.img_url === "")
  );

  if (hasBlankSignatures) {
    setError({
      title: "Missing Signatures",
      message: "Please sign all your designated signature fields (shown in blue) before finalizing."
    });
    return;
  }

  setIsFinalizing(true);
  try {
    // First, ensure all signatures are saved with the parties update
    const contractResponse = await fetch(`/api/contracts/${contractId}`);
    if (!contractResponse.ok) {
      throw new Error('Failed to fetch contract');
    }
    
    const { contract: currentContract } = await contractResponse.json();
    
    // Check if all parties have signed
    const allPartiesSigned = currentContract.parties?.every((party: any) => party.signed) || false;
    
    // Sign the contract (this endpoint should handle the final verification)
    const response = await fetch(`/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractJson: contractJson,
        timestamp: new Date().toISOString(),
        token: token
      }),
    });

    if (response.ok) {
      // If all parties have signed, send finalized contract email
      if (allPartiesSigned) {
        await fetch(`/api/contracts/${contractId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractJson,
            recipientEmail
          }),
        });
      }

      router.push('/thank-you');
    } else {
      const errorData = await response.json();
      setError({
        title: "Signing Failed",
        message: errorData.error || 'Failed to sign the contract. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error signing contract:', error);
    setError({
      title: "Error",
      message: 'An error occurred while signing. Please try again.'
    });
  } finally {
    setIsFinalizing(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="w-12 h-12" />
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || !contract || !contractJson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Unable to Load Contract</h1>
          <p className="text-gray-600 mb-6">
            {error?.message || 'The signing link is invalid or has expired.'}
          </p>
          <p className="text-sm text-gray-500">
            Please contact the sender for a new signing link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-6 h-full">
        {/* Contract Display - Centered with max width */}
        <div className="w-full max-w-4xl flex flex-col">
          {/* Header - Fixed */}
          <div className="mb-6 bg-white rounded-lg p-6 shadow-md flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Sign Contract
            </h1>
            <p className="text-gray-600">
              Please review the contract and sign in the designated areas (shown in blue).
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Signing as: <span className="font-medium">{recipientEmail}</span>
            </p>
          </div>

          {/* Contract Blocks - Scrollable */}
          <div className="flex-1 overflow-y-auto pb-4">
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
                  <span className="ml-2">Finalizing...</span>
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

          {/* Error Modal */}
          <ErrorModal
            isOpen={!!error}
            onClose={() => setError(null)}
            title={error?.title || ""}
            message={error?.message || ""}
          />
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function SignContractPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="w-12 h-12" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignContractContent />
    </Suspense>
  );
} 