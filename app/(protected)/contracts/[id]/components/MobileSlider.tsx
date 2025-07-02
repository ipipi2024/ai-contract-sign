"use client";

import { useState, useRef } from 'react';
import { ContractView } from './ContractView';
import { ChatInterface } from './ChatInterface';
import { ContractJson } from '../types/contract';
import { ChatMessage } from '../types/chat';

interface MobileSliderProps {
  contractJson: ContractJson | null;
  currentParty: string;
  onSignatureClick: (blockIndex: number, signatureIndex: number) => void;
  onRegenerateBlock: (blockIndex: number, userInstructions: string) => void;
  onManualBlockEdit: (blockIndex: number, updatedBlock: any) => void;
  saveStatus: 'saved' | 'saving' | 'error';
  onShowPreview: () => void;
  onDownloadPDF: () => void;
  isDownloadingPDF: boolean;
  recipientEmail: string;
  onRecipientEmailChange: (email: string) => void;
  onSendContract: () => void;
  isSendingContract: boolean;
  chatMessages: ChatMessage[];
  isGeneratingInitialMessage: boolean;
  isProcessingChatMessage: boolean;
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendChatMessage: (message: string) => void;
}

export const MobileSlider: React.FC<MobileSliderProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'contract' | 'info'>('contract');
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canSwipe, setCanSwipe] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Check if the touch target is an interactive element
    const target = e.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[data-index]') || // Signature fields
      target.closest('[data-signature-field]') || // Signature fields with specific attribute
      target.closest('[onClick]') ||
      target.closest('.cursor-pointer') ||
      target.closest('.hover\\:border-gray-300'); // Contract blocks that open modal
    
    if (isInteractive) {
      setCanSwipe(false);
      return; // Don't start swipe if touching an interactive element
    }
    
    setCanSwipe(true);
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !canSwipe) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !canSwipe) {
      setIsDragging(false);
      setCurrentX(0);
      setCanSwipe(true);
      return;
    }
    
    const diffX = startX - currentX;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && activeTab === 'contract') {
        // Swipe left - go to info
        setActiveTab('info');
      } else if (diffX < 0 && activeTab === 'info') {
        // Swipe right - go to contract
        setActiveTab('contract');
      }
    }

    setIsDragging(false);
    setCurrentX(0);
    setCanSwipe(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation with visual swipe indicator */}
      <div className="flex border-b border-gray-200 relative">
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

      {/* Swipe hint */}
      <div className="text-xs text-gray-500 text-center py-1 bg-gray-50">
        Swipe left/right to switch tabs
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'contract' ? (
          /* Contract View */
          <div 
            className="h-full flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ContractView
                contractJson={props.contractJson}
                currentParty={props.currentParty}
                onSignatureClick={props.onSignatureClick}
                onRegenerateBlock={props.onRegenerateBlock}
                onManualBlockEdit={props.onManualBlockEdit}
                saveStatus={props.saveStatus}
                onShowPreview={props.onShowPreview}
                onDownloadPDF={props.onDownloadPDF}
                isDownloadingPDF={props.isDownloadingPDF}
                isMobile={false}
              />
            </div>
            
            {/* Send Contract Panel - Only in Contract Tab */}
            <div className="bg-white border-t p-4 space-y-3">
              <input
                type="email"
                value={props.recipientEmail}
                onChange={(e) => props.onRecipientEmailChange(e.target.value)}
                placeholder="Recipient Email"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
              />
              <button
                onClick={props.onSendContract}
                disabled={props.isSendingContract}
                className={`w-full py-3 text-white rounded-md transition flex items-center justify-center text-sm ${
                  props.isSendingContract
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-900'
                }`}
              >
                {props.isSendingContract ? 'Sending...' : 'Send Contract →'}
              </button>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div 
            className="h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ChatInterface
              chatMessages={props.chatMessages}
              isGeneratingInitialMessage={props.isGeneratingInitialMessage}
              isProcessingChatMessage={props.isProcessingChatMessage}
              newMessage={props.newMessage}
              onNewMessageChange={props.onNewMessageChange}
              onSendMessage={props.onSendChatMessage}
              isMobile={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};