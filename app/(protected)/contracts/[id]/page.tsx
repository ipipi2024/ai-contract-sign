"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation';
import ContractBlock from "@/components/ContractBlock";
import SignatureModal from "@/components/SignatureModal";
import ContractSummary from "@/components/ContractSummary";

interface Contract {
  _id: string;
  content: string;
  recipientEmail?: string;
}

interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
  index: number; // index of the signature in the block
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  title?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contractRegenerated?: boolean; // Track if this message triggered a contract regeneration
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

// Save status type
type SaveStatus = 'saved' | 'saving' | 'error';

// Save Status Indicator Component
const SaveStatusIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <span>Saving</span>
        <div className="flex ml-0.75 items-center mt-1.5">
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '200ms' }}></div>
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    );
  }
  
  if (status === 'saved') {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <span>Saved</span>
        <svg className="w-4 h-4 ml-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  
  return null;
};

const ErrorModal = ({ isOpen, onClose, title, message }: ErrorModalProps) => {
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
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader components
const SkeletonBlock = () => (
  <div className="mb-2 p-4 rounded border border-gray-200 bg-white animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex space-x-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-blue-100 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);

const SkeletonSummary = () => (
  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const SkeletonSendPanel = () => (
  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-3"></div>
    <div className="h-12 bg-gray-200 rounded"></div>
  </div>
);

// Loading spinner component
const LoadingSpinner = ({ size = "w-5 h-5" }: { size?: string }) => {
  console.log('🌀 LoadingSpinner rendered with size:', size);
  return (
    <svg className={`${size} animate-spin text-white`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyA"); // Assume user is PartyA
  const [isRegeneratingContract, setIsRegeneratingContract] = useState(false);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'contract' | 'info'>('contract');
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const hasFetchedRef = useRef(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGeneratingInitialMessage, setIsGeneratingInitialMessage] = useState(false);
  const [isProcessingChatMessage, setIsProcessingChatMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const hasGeneratedInitialMessage = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(false);
  const scrollPositionRef = useRef(0);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchContract();
  }, []);

  // Save contract to database
  const saveContract = async (contractData: ContractJson) => {
    if (!contractData) return;
    
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/contracts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(contractData),
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
      } else {
        console.error('Failed to save contract');
        setSaveStatus('error');
        // Reset to saved after a short delay
        setTimeout(() => setSaveStatus('saved'), 2000);
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      setSaveStatus('error');
      // Reset to saved after a short delay
      setTimeout(() => setSaveStatus('saved'), 2000);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback((contractData: ContractJson) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveContract(contractData);
    }, 500); // 500ms delay for better responsiveness
  }, []);

  // Trigger save when contractJson changes
  useEffect(() => {
    if (contractJson && !isLoading) {
      debouncedSave(contractJson);
    }
  }, [contractJson, debouncedSave, isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Preserve scroll position during re-renders
  useEffect(() => {
    if (chatContainerRef.current && !shouldScrollToBottom.current) {
      chatContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  // Save scroll position before re-renders
  const saveScrollPosition = useCallback(() => {
    if (chatContainerRef.current) {
      scrollPositionRef.current = chatContainerRef.current.scrollTop;
    }
  }, []);

  // Scroll to bottom only when new messages are added
  useEffect(() => {
    if (shouldScrollToBottom.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      shouldScrollToBottom.current = false;
    }
  }, [chatMessages.length]);

  // Generate initial AI message when contract loads
  useEffect(() => {
    if (contractJson && chatMessages.length === 0 && !hasGeneratedInitialMessage.current) {
      hasGeneratedInitialMessage.current = true;
      generateInitialAIMessage();
    }
  }, [contractJson]);

  const generateInitialAIMessage = async () => {
    if (!contractJson) return;
    
    setIsGeneratingInitialMessage(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Assess the contract.",
          contractJson,
          chatHistory: [],
          isInitialMessage: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const initialMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        setChatMessages([initialMessage]);
        shouldScrollToBottom.current = true;
      } else {
        // Fallback message if AI fails
        const fallbackMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Hello! I'm here to help you with your contract. Please let me know what you'd like to improve or add.",
          timestamp: new Date()
        };
        
        setChatMessages([fallbackMessage]);
        shouldScrollToBottom.current = true;
      }
    } catch (error) {
      console.error('Error generating initial AI message:', error);
      
      // Fallback message if AI fails
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm here to help you with your contract. Please let me know what you'd like to improve or add.",
        timestamp: new Date()
      };
      
      setChatMessages([fallbackMessage]);
      shouldScrollToBottom.current = true;
    } finally {
      setIsGeneratingInitialMessage(false);
    }
  };

  const processChatMessage = async (userMessage: string) => {
    if (!contractJson || !userMessage.trim()) return;
    
    setIsProcessingChatMessage(true);
    
    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userChatMessage]);
    shouldScrollToBottom.current = true;
    
    try {
      // First, ask AI to analyze the message and decide if contract should be regenerated
      const analysisResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Analyze this user message and determine if they want to modify the contract with new information. 
          
User message: "${userMessage}"

Respond with ONLY a JSON object like this:
{
  "shouldRegenerate": true/false,
  "reason": "brief explanation",
  "response": "your helpful response to the user"
}

If the user is providing new information that should be incorporated into the contract, set shouldRegenerate to true.
If the user is just asking questions or seeking clarification, set shouldRegenerate to false.
If you're unsure, set shouldRegenerate to false and ask the user if they want you to regenerate the contract with their input.`,
          contractJson,
          chatHistory: chatMessages,
          isAnalysis: true
        }),
      });
      
      let shouldRegenerate = false;
      let aiResponse = "";
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        console.log('AI Analysis Response:', analysisData.response);
        
        try {
          // First, try to parse the response as JSON
          const parsedResponse = JSON.parse(analysisData.response);
          console.log('Parsed Response:', parsedResponse);
          shouldRegenerate = parsedResponse.shouldRegenerate || false;
          aiResponse = parsedResponse.response || "I'm here to help! You can ask me to regenerate the contract, add specific terms, or ask questions about the current contract.";
        } catch (parseError) {
          console.log('Parse Error:', parseError);
          // If parsing fails, check if the response itself is a JSON object
          if (analysisData.response && analysisData.response.trim().startsWith('{')) {
            try {
              const directJson = JSON.parse(analysisData.response);
              console.log('Direct JSON:', directJson);
              shouldRegenerate = directJson.shouldRegenerate || false;
              aiResponse = directJson.response || "I'm here to help! You can ask me to regenerate the contract, add specific terms, or ask questions about the current contract.";
            } catch (secondParseError) {
              console.log('Second Parse Error:', secondParseError);
              // If all parsing fails, treat as a regular response
              aiResponse = analysisData.response;
              shouldRegenerate = false;
            }
          } else {
            // If parsing fails, treat as a regular response
            aiResponse = analysisData.response;
            shouldRegenerate = false;
          }
        }
      } else {
        aiResponse = "I'm sorry, I couldn't process your request. Please try again.";
      }
      
      // Add AI response to chat immediately
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        contractRegenerated: false
      };
      
      setChatMessages(prev => [...prev, aiChatMessage]);
      shouldScrollToBottom.current = true;
      
      // If regeneration is needed, do it after showing the response
      if (shouldRegenerate) {
        // Regenerate contract
        setIsRegeneratingContract(true);
        
        // Regenerate contract
        const regenerateResponse = await fetch("/api/regenerateContract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractJson,
            userPrompt: userMessage,
          }),
        });
        
        if (regenerateResponse.ok) {
          const newContractJson = await regenerateResponse.json();
          setContractJson(newContractJson);
          
          // Generate a summary of what was changed
          const summaryResponse = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `The contract has been updated based on the user's request: "${userMessage}". 
              
Please provide a brief summary (max 100 words, 50 if possible for brevity) of what was added or changed in the contract. Focus on the key improvements or additions made.

After your summary, say something like: "I've done ..., in order to complete the contract I need you to provide: [bulleted list of unknowns]"
However, and this is CRITICAL, if there are no unknowns in the list, do not say anything like this.
Essentially, if no unknowns are listed, do not mention anything about the unknowns and do not include the phrase "in order to complete the contract I need you to provide:".`,
              contractJson: newContractJson,
              chatHistory: chatMessages,
              isSummary: true
            }),
          });
          
          let summaryText = "✅ Contract has been updated with your requested changes.";
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            summaryText = summaryData.response;
          }
          
          
          const summaryMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: summaryText,
            timestamp: new Date(),
            contractRegenerated: false
          };
          setChatMessages(prev => [...prev, summaryMessage]);
          shouldScrollToBottom.current = true;

          setIsRegeneratingContract(false);
          
        } else {
          // Handle specific error types
          const errorData = await regenerateResponse.json();
          let errorMessage = "❌ Sorry, I encountered an error. Please try again.";
          
          if (regenerateResponse.status === 429) {
            // Rate limit error
            const retryAfter = errorData.retryAfter || '60';
            errorMessage = `⏰ OpenAI rate limit reached. Please wait ${retryAfter} seconds and try again.`;
          } else if (errorData.error) {
            // Specific error message from API
            errorMessage = `❌ ${errorData.error}`;
          }
          
          // Replace the loading message with error
          const errorChatMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
            contractRegenerated: false
          };
          setChatMessages(prev => [...prev, errorChatMessage]);
          shouldScrollToBottom.current = true;
        }
      }
      
    } catch (error) {
      console.error('Error processing chat message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "❌ Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      shouldScrollToBottom.current = true;
    } finally {
      setIsProcessingChatMessage(false);
    }
  };

  // Handle responsive view detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();

        setContract(data.contract);
        
        // Parse contract content since it's stored as a string
        let parsedContent;
        if (typeof data.contract.content === 'string') {
          parsedContent = JSON.parse(data.contract.content);
        } else {
          parsedContent = data.contract.content;
        }
        setContractJson(parsedContent);
        
        // Set save status to saved since contract was loaded from database
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to update a single block after regeneration
  const handleRegenerateBlock = async (blockIndex: number, userInstructions: string) => {
    if (!contractJson) return;
    try {
      const res = await fetch("/api/regenerateBlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractJson,
          blockIndex,
          userPrompt: userInstructions,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        setError({
          title: "Block Regeneration Failed",
          message: errorData.error || "Failed to regenerate block. Please try again."
        });
        return;
      }
      
      const data = await res.json();
      
      if (!data || !data.blocks || !Array.isArray(data.blocks)) {
        console.error('Invalid response structure:', data);
        setError({
          title: "Invalid Response",
          message: "Received invalid response from server. Please try again."
        });
        return;
      }
      
      setContractJson(data);
    } catch (err) {
      console.error('Error regenerating block:', err);
      setError({
        title: "Error",
        message: "Failed to regenerate block. Please try again."
      });
    }
  };

  // New handler for manual block edits
  const handleManualBlockEdit = (blockIndex: number, updatedBlock: any) => {
    if (!contractJson) return;
    
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex] = updatedBlock;
      
      return { ...prev, blocks: updatedBlocks };
    });
  };

  // Handler to update a signature field
  const handleSignatureSave = async (blockIndex: number, signatureIndex: number, signatureData: { img_url: string; name: string; date: string }) => {
    console.log('handleSignatureSave called:', { blockIndex, signatureIndex, signatureData });
    
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      const block = { ...updatedBlocks[blockIndex] };
      const signatures = [...block.signatures];
      
      console.log('Before update:', {
        signatureExists: !!signatures[signatureIndex],
        currentParty,
        signatureParty: signatures[signatureIndex]?.party,
        oldImgUrl: signatures[signatureIndex]?.img_url
      });
      
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

      console.log('After update:', {
        newImgUrl: signatures[signatureIndex].img_url,
        signatureLength: signatures[signatureIndex].img_url.length
      });

      return { ...prev, blocks: updatedBlocks };
    });

    // After state update, make API call
    const contractId = params.id;
  try {
    const response = await fetch(`/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'pending'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to update contract status:', error);
      // Handle error - maybe show a toast notification
    }
  } catch (error) {
    console.error('Error updating contract status:', error);
  }

  };

  // Handler to send contract via email
  const handleSendContract = async () => {
    if (!recipientEmail) {
      setError({
        title: "Missing Recipient Email",
        message: "Please enter a recipient email address before sending the contract."
      });
      return;
    }

    setIsSendingContract(true);
    try {
      const response = await fetch(`/api/contracts/${params.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractJson,
          recipientEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send contract');
      }

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

  // Handler to download PDF
  const handleDownloadPDF = async () => {
    if (!contractJson || isDownloadingPDF) return;
    
    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`/api/contracts/${params.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractJson }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract-${params.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError({
          title: "PDF Generation Failed",
          message: "Failed to generate PDF. Please try again."
        });
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError({
        title: "Error",
        message: "An error occurred while generating the PDF. Please try again."
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Contract Preview Modal
  const ContractPreviewModal = () => {
    if (!contractJson) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setShowPreview(false);
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={handleBackdropClick}></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contract Preview</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center cursor-pointer transition-colors ${
                  isDownloadingPDF 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isDownloadingPDF ? (
                  <>
                    <LoadingSpinner size="w-4 h-4" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Modal Body - Contract Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-200 p-8">
              {/* Contract Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                <h1 className="text-2xl font-bold mb-2">{contractJson.title || 'CONTRACT'}</h1>
                <p className="text-gray-600">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-gray-600">Contract ID: {params.id}</p>
              </div>
              
              {/* Contract Content */}
              <div className="space-y-6">
                {contractJson.blocks.map((block, index) => {
                  let processedText = block.text;
                  
                  // Replace underscores with signature placeholders
                  block.signatures.forEach((signature) => {
                    const underscorePattern = /_{20}/;
                    if (signature.img_url && signature.img_url.trim() !== '') {
                      // If signed, show signature info
                      processedText = processedText.replace(
                        underscorePattern,
                        `<br/><br/>
                          <div class="ml-4">
                            <div class="text-sm">Name: <span class="font-normal">${signature.name || '_______________'}</span></div>
                            <div class="text-sm">Signature: <img src="${signature.img_url}" alt="Signature" class="inline-block h-8 max-w-32 object-contain" /></div>
                            <div class="text-sm">Date: <span class="font-normal">${signature.date || '_______________'}</span></div>
                          </div>`
                      );
                    } else {
                      // If not signed, show blank fields
                      processedText = processedText.replace(
                        underscorePattern,
                        `<br/><br/>
                          <div class="ml-4">
                            <div class="text-sm">Name: <span class="text-gray-400">_______________</span></div>
                            <div class="text-sm">Signature: <span class="text-gray-400">_______________</span></div>
                            <div class="text-sm">Date: <span class="text-gray-400">_______________</span></div>
                          </div>`
                      );
                    }
                  });
                  
                  return (
                    <div key={index} className="text-gray-800 leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: processedText }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile tab navigation
  const MobileTabNav = () => (
    <div className="flex border-b border-gray-200 mb-4 lg:hidden">
      <button
        onClick={() => setActiveTab('contract')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activeTab === 'contract'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Contract
      </button>
      <button
        onClick={() => setActiveTab('info')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activeTab === 'info'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Contract Agent
      </button>
    </div>
  );

  // Chat Input Component (separate to prevent re-renders)
  const ChatInput = useCallback(() => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Keep input focused when typing
    useEffect(() => {
      if (inputRef.current && !isProcessingChatMessage && newMessage.length > 0) {
        inputRef.current.focus();
      }
    }, [isProcessingChatMessage, newMessage]);
    
    const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim() && !isProcessingChatMessage) {
        processChatMessage(newMessage);
        setNewMessage("");
      }
    };

    return (
      <div className="p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              // Ensure we don't scroll when typing
              shouldScrollToBottom.current = false;
            }}
            placeholder="Ask me to improve your contract..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={isProcessingChatMessage}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors 
              ${ isProcessingChatMessage
                ? 'bg-gray-800 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900 cursor-pointer'
            }`}
          >
            {isProcessingChatMessage ? (
              <LoadingSpinner size="w-4 h-4" />
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    );
  }, [newMessage, isProcessingChatMessage, processChatMessage]);

  // Chat Interface Component
  const ChatInterface = useCallback(() => {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
        {/* Chat Header */}
        <div className="p-4 pl-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contract Agent</h2>
          <p className="text-xs text-gray-500">
            Ask me to improve your contract or answer your questions          
          </p>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
          onScroll={saveScrollPosition}
        >
          {isGeneratingInitialMessage ? (
            <>
              <div className="flex justify-start">
                <div className="min-w-[350px] max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-300 rounded animate-pulse" style={{width: '100%'}}></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse" style={{width: '85%'}}></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse" style={{width: '70%'}}></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse" style={{width: '90%'}}></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </>
          ) : chatMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="w-5 h-5" />
              <span className="text-gray-500 ml-2">Loading AI assistant...</span>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.contractRegenerated && (
                    <div className="mt-2 text-xs opacity-75">
                      🔄 Contract was updated
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <ChatInput />
      </div>
    );
  }, [chatMessages, isGeneratingInitialMessage, saveScrollPosition, ChatInput]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] bg-gray-50">
      {isLoading || !contractJson ? (
        <div className="flex flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:space-x-6 h-0">
          {/* Desktop: Side by side, Mobile: Stacked */}
          <div className="w-full lg:w-7/12 flex-1 overflow-y-auto pb-4 lg:pr-2">
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-48 sm:w-64 mb-4 animate-pulse"></div>
              <div className="text-sm text-gray-500 mb-4">Generating your contract...</div>
            </div>
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} />
            ))}
          </div>

          {/* Right side - Hidden on mobile during loading */}
          <div className="hidden lg:block lg:w-5/12 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <SkeletonSummary />
            </div>
            <div className="mt-4">
              <SkeletonSendPanel />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:space-x-6 min-h-0 overflow-hidden">
          {/* Mobile tab navigation */}
          {isMobileView && <MobileTabNav />}

          {/* Left: Contract Blocks */}
          <div className={`${isMobileView && activeTab !== 'contract' ? 'hidden' : ''} w-full lg:w-7/12 flex flex-col h-full`}>
            {/* Preview and Download Buttons with Save Status */}
            <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 flex items-center cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center cursor-pointer transition-colors ${
                    isDownloadingPDF 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isDownloadingPDF ? (
                    <>
                      <LoadingSpinner size="w-4 h-4" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
              
              {/* Save Status Indicator */}
              <div className="mr-2">
                <SaveStatusIndicator status={saveStatus} />
              </div>
            </div>

            {/* Contract Blocks - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-4 lg:pr-2">
              {contractJson?.blocks?.map((block, i) => (
                <ContractBlock
                  key={i}
                  block={block}
                  blockIndex={i}
                  currentParty={currentParty}
                  onSignatureClick={(signatureIndex: number) => {
                    console.log('Signature click received:', { blockIndex: i, signatureIndex, totalSignatures: block.signatures.length });
                    
                    const signature = block.signatures[signatureIndex];
                    if (!signature) {
                      console.error('No signature found at index:', signatureIndex, 'Available signatures:', block.signatures.length);
                      return;
                    }
                    
                    if (signature.party !== currentParty) {
                      console.log('Wrong party - signature belongs to:', signature.party, 'but current party is:', currentParty);
                      return;
                    }
                    
                    setShowSignatureFor({ blockIndex: i, signatureIndex });
                  }}
                  onRegenerate={(userInstructions: string) =>
                    handleRegenerateBlock(i, userInstructions)
                  }
                  onManualEdit={(updatedBlock: any) =>
                    handleManualBlockEdit(i, updatedBlock)
                  }
                />
              ))}
            </div>

            {/* Signature Modal */}
            {showSignatureFor && (
              <SignatureModal
                onClose={() => setShowSignatureFor(null)}
                onSave={(signatureData: { img_url: string; name: string; date: string }) => {
                  const { blockIndex, signatureIndex } = showSignatureFor!;
                  console.log('Received signature data:', {
                    blockIndex,
                    signatureIndex,
                    signatureData
                  });
                  handleSignatureSave(blockIndex, signatureIndex, signatureData);
                  setShowSignatureFor(null);
                }}
              />
            )}
          </div>

          {/* Right: Info + Send Panel */}
          <div className={`${isMobileView && activeTab !== 'info' ? 'hidden' : ''} w-full lg:w-5/12 h-full flex flex-col space-y-4`}>
            {/* Chat Interface */}
            <div className="flex-1 min-h-0">
              <ChatInterface />
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
                className={`mt-3 w-full py-3 text-white rounded-md transition flex items-center justify-center text-sm sm:text-base cursor-pointer ${
                  isSendingContract
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-900 cursor-pointer'
                }`}
              >
                {(() => {
                  console.log('📧 Send button render - isSendingContract:', isSendingContract);
                  return isSendingContract ? (
                    <>
                      <LoadingSpinner size="w-4 h-4" />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    'Send Contract →'
                  );
                })()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {showPreview && <ContractPreviewModal />}

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title={error?.title || ""}
        message={error?.message || ""}
      />
    </div>
  );
}