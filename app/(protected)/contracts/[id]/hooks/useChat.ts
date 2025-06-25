import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { ContractJson } from '../types/contract';
import { chatApi } from '../utils/api';

export const useChat = (
  contractJson: ContractJson | null,
  setContractJson: React.Dispatch<React.SetStateAction<ContractJson | null>>
) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGeneratingInitialMessage, setIsGeneratingInitialMessage] = useState(false);
  const [isProcessingChatMessage, setIsProcessingChatMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isRegeneratingContract, setIsRegeneratingContract] = useState(false);
  const hasGeneratedInitialMessage = useRef(false);

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
      const data = await chatApi.sendMessage(
        "Assess the contract.",
        contractJson,
        [],
        { isInitialMessage: true }
      );
      
      const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setChatMessages([initialMessage]);
    } catch (error) {
      console.error('Error generating initial AI message:', error);
      
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm here to help you with your contract. Please let me know what you'd like to improve or add.",
        timestamp: new Date()
      };
      
      setChatMessages([fallbackMessage]);
    } finally {
      setIsGeneratingInitialMessage(false);
    }
  };

  const processChatMessage = async (userMessage: string) => {
    if (!contractJson || !userMessage.trim()) return;
    
    setIsProcessingChatMessage(true);
    setNewMessage("");
    
    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userChatMessage]);
    
    try {
      // Analyze message
      const analysisResponse = await chatApi.sendMessage(
        `Analyze this user message and determine if they want to modify the contract with new information. 
        
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
        chatMessages,
        { isAnalysis: true }
      );
      
      let shouldRegenerate = false;
      let aiResponse = "";
      
      try {
        const parsedResponse = JSON.parse(analysisResponse.response);
        shouldRegenerate = parsedResponse.shouldRegenerate || false;
        aiResponse = parsedResponse.response || "I'm here to help! You can ask me to regenerate the contract, add specific terms, or ask questions about the current contract.";
      } catch (parseError) {
        // If parsing fails, check if the response itself is a JSON object
        if (analysisResponse.response && analysisResponse.response.trim().startsWith('{')) {
          try {
            const directJson = JSON.parse(analysisResponse.response);
            shouldRegenerate = directJson.shouldRegenerate || false;
            aiResponse = directJson.response || "I'm here to help! You can ask me to regenerate the contract, add specific terms, or ask questions about the current contract.";
          } catch (secondParseError) {
            // If all parsing fails, treat as a regular response
            aiResponse = analysisResponse.response;
            shouldRegenerate = false;
          }
        } else {
          // If parsing fails, treat as a regular response
          aiResponse = analysisResponse.response;
          shouldRegenerate = false;
        }
      }
      
      // Add AI response
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        contractRegenerated: false
      };
      
      setChatMessages(prev => [...prev, aiChatMessage]);
      
      // Regenerate if needed
      if (shouldRegenerate) {
        setIsRegeneratingContract(true);
        
        try {
          const newContractJson = await chatApi.regenerateContract(contractJson, userMessage);
          setContractJson(newContractJson);
          
          // Generate summary
          const summaryResponse = await chatApi.sendMessage(
            `The contract has been updated based on the user's request: "${userMessage}". 
            
Please provide a brief summary (max 100 words, 50 if possible for brevity) of what was added or changed in the contract. Focus on the key improvements or additions made.

After your summary, say something like: "I've done ..., in order to complete the contract I need you to provide: [bulleted list of unknowns]"
However, and this is CRITICAL, if there are no unknowns in the list, do not say anything like this.
Essentially, if no unknowns are listed, do not mention anything about the unknowns and do not include the phrase "in order to complete the contract I need you to provide:".`,
            newContractJson,
            chatMessages,
            { isSummary: true }
          );
          
          let summaryText = "✅ Contract has been updated with your requested changes.";
          
          if (summaryResponse.response) {
            summaryText = summaryResponse.response;
          }
          
          const summaryMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: summaryText,
            timestamp: new Date(),
            contractRegenerated: false
          };
          
          setChatMessages(prev => [...prev, summaryMessage]);
        } catch (error) {
          // Handle specific error types
          let errorMessage = "❌ Sorry, I encountered an error. Please try again.";
          
          if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
              errorMessage = `⏰ OpenAI rate limit reached. Please wait a moment and try again.`;
            } else {
              errorMessage = `❌ ${error.message}`;
            }
          }
          
          const errorChatMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
            contractRegenerated: false
          };
          
          setChatMessages(prev => [...prev, errorChatMessage]);
        } finally {
          setIsRegeneratingContract(false);
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
    } finally {
      setIsProcessingChatMessage(false);
    }
  };

  return {
    chatMessages,
    isGeneratingInitialMessage,
    isProcessingChatMessage,
    newMessage,
    setNewMessage,
    processChatMessage,
    isRegeneratingContract,
    setIsRegeneratingContract
  };
};