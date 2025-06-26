//app/(protected)/contracts/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import SignatureModal from "@/components/SignatureModal";
import { ContractView } from './components/ContractView';
import { ChatInterface } from './components/ChatInterface';
import { MobileSlider } from './components/MobileSlider';
import { ContractPreviewModal } from './components/ContractPreviewModal';
import { ErrorModal } from './components/ErrorModal';
import { SkeletonLoaders } from './components/SkeletonLoaders';
import { useContract } from './hooks/useContract';
import { useChat } from './hooks/useChat';
import { useMobileDetect } from './hooks/useMobileDetect';
import { contractApi } from './utils/api';

export default function ContractPage() {
  const router = useRouter();
  const isMobileView = useMobileDetect();
  
  // Contract management
  const {
    contract,
    contractJson,
    setContractJson,
    isLoading,
    saveStatus,
    error,
    setError,
    setContract
  } = useContract();

  // Chat management
  const {
    chatMessages,
    isGeneratingInitialMessage,
    isProcessingChatMessage,
    newMessage,
    setNewMessage,
    processChatMessage,
    setIsRegeneratingContract
  } = useChat(contractJson, setContractJson);

  // Local state
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyA");
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Handlers
  const handleRegenerateBlock = async (blockIndex: number, userInstructions: string) => {
    if (!contractJson) return;
    try {
      const data = await contractApi.regenerateBlock(contractJson, blockIndex, userInstructions);
      setContractJson(data);
    } catch (err) {
      console.error('Error regenerating block:', err);
      setError({
        title: "Block Regeneration Failed",
        message: err instanceof Error ? err.message : "Failed to regenerate block. Please try again."
      });
    }
  };

  const handleManualBlockEdit = (blockIndex: number, updatedBlock: any) => {
    if (!contractJson) return;
    
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex] = updatedBlock;
      
      return { ...prev, blocks: updatedBlocks };
    });
  };

  const handleSignatureSave = async (blockIndex: number, signatureIndex: number, signatureData: { img_url: string; name: string; date: string }) => {
    if (!contractJson || !contract) return;

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

      // Update parties array
      let updatedParties = contract.parties || [];
      const partyIndex = updatedParties.findIndex((party: any) => 
        party.role === (currentParty === 'PartyA' ? 'Disclosing Party' : 'Receiving Party') ||
        party.name === signatureData.name
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
      
      await contractApi.updateContract(contract._id, {
        content: JSON.stringify(updatedContractJson),
        parties: updatedParties,
        status: newStatus
      });

      setContract(prev => prev ? {
        ...prev,
        parties: updatedParties,
        status: newStatus
      } : null);
      
    } catch (error) {
      console.error('Error updating contract:', error);
      setError({
        title: "Failed to Save Signature",
        message: "Failed to save signature. Please try again."
      });
    }
  };

  const handleSendContract = async () => {
    if (!recipientEmail || !contractJson) {
      setError({
        title: "Missing Information",
        message: !recipientEmail ? "Please enter a recipient email address." : "Contract data is missing."
      });
      return;
    }

    setIsSendingContract(true);
    try {
      await contractApi.sendContract(contract?._id || '', contractJson, recipientEmail);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error sending contract:', error);
      setError({
        title: "Error Sending Contract",
        message: error instanceof Error ? error.message : 'Failed to send contract'
      });
    } finally {
      setIsSendingContract(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contractJson || !contract) return;
    
    setIsDownloadingPDF(true);
    try {
      const blob = await contractApi.generatePDF(contract._id, contractJson);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError({
        title: "PDF Generation Failed",
        message: "Failed to generate PDF. Please try again."
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (isLoading || !contractJson) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-gray-50">
        <SkeletonLoaders />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] bg-gray-50">
      {isMobileView ? (
        // Mobile View with Slider
        <MobileSlider
          contractJson={contractJson}
          currentParty={currentParty}
          onSignatureClick={(blockIndex, signatureIndex) => 
            setShowSignatureFor({ blockIndex, signatureIndex })
          }
          onRegenerateBlock={handleRegenerateBlock}
          onManualBlockEdit={handleManualBlockEdit}
          saveStatus={saveStatus}
          onShowPreview={() => setShowPreview(true)}
          onDownloadPDF={handleDownloadPDF}
          isDownloadingPDF={isDownloadingPDF}
          recipientEmail={recipientEmail}
          onRecipientEmailChange={setRecipientEmail}
          onSendContract={handleSendContract}
          isSendingContract={isSendingContract}
          chatMessages={chatMessages}
          isGeneratingInitialMessage={isGeneratingInitialMessage}
          isProcessingChatMessage={isProcessingChatMessage}
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendChatMessage={processChatMessage}
        />
      ) : (
        // Desktop View - Side by Side
        <div className="flex flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:space-x-6 min-h-0 overflow-hidden">
          {/* Left: Contract Blocks */}
          <div className="w-full lg:w-7/12 flex flex-col h-full">
            <ContractView
              contractJson={contractJson}
              currentParty={currentParty}
              onSignatureClick={(blockIndex, signatureIndex) => 
                setShowSignatureFor({ blockIndex, signatureIndex })
              }
              onRegenerateBlock={handleRegenerateBlock}
              onManualBlockEdit={handleManualBlockEdit}
              saveStatus={saveStatus}
              onShowPreview={() => setShowPreview(true)}
              onDownloadPDF={handleDownloadPDF}
              isDownloadingPDF={isDownloadingPDF}
            />
          </div>

          {/* Right: Chat + Send Panel */}
          <div className="w-full lg:w-5/12 h-full flex flex-col space-y-4">
            {/* Chat Interface */}
            <div className="flex-1 min-h-0">
              <ChatInterface
                chatMessages={chatMessages}
                isGeneratingInitialMessage={isGeneratingInitialMessage}
                isProcessingChatMessage={isProcessingChatMessage}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={processChatMessage}
              />
            </div>

            {/* Recipient Email Input - Fixed at Bottom */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md flex-shrink-0">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient Email"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendContract();
                  }
                }}
              />
              <button
                onClick={handleSendContract}
                disabled={isSendingContract}
                className={`mt-3 w-full py-3 text-white rounded-md transition flex items-center justify-center text-sm sm:text-base ${
                  isSendingContract
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-900'
                }`}
              >
                {isSendingContract ? 'Sending...' : 'Send Contract →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSignatureFor && (
        <SignatureModal
          onClose={() => setShowSignatureFor(null)}
          onSave={(signatureData) => {
            const { blockIndex, signatureIndex } = showSignatureFor;
            handleSignatureSave(blockIndex, signatureIndex, signatureData);
            setShowSignatureFor(null);
          }}
        />
      )}

      {showPreview && (
        <ContractPreviewModal
          contractJson={contractJson}
          contractId={contract?._id || ''}
          onClose={() => setShowPreview(false)}
          onDownloadPDF={handleDownloadPDF}
          isDownloadingPDF={isDownloadingPDF}
        />
      )}

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title={error?.title || ""}
        message={error?.message || ""}
      />
    </div>
  );
}