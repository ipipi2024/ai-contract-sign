"use client";

import { useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  isGeneratingInitialMessage: boolean;
  isProcessingChatMessage: boolean;
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: (message: string) => void;
  isMobile?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatMessages,
  isGeneratingInitialMessage,
  isProcessingChatMessage,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  isMobile = false
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isProcessingChatMessage) {
      onSendMessage(newMessage);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${isMobile ? '' : 'rounded-lg shadow-md'}`}>
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
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {isGeneratingInitialMessage ? (
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
      <div className="p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            placeholder="Ask me to improve your contract..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={isProcessingChatMessage}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isProcessingChatMessage
                ? 'bg-gray-800 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900'
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
    </div>
  );
};