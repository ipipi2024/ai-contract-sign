// app/(protected)/contracts/[id]/components/EnhancedContractView.tsx
"use client";

import { useState, useEffect } from 'react';
import { ContractJson } from '../types/contract';
import ContractBlock from '@/components/ContractBlock';
import DocumentViewer from '@/components/DocumentViewer';
import { ProcessedDocument } from '@/lib/documentProcessor';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { LoadingSpinner } from './LoadingSpinner';
import { FileText, Code } from 'lucide-react';

interface EnhancedContractViewProps {
  contractJson: ContractJson | null;
  contractContent?: any; // For uploaded documents
  currentParty: string;
  onSignatureClick: (blockIndex: number, signatureIndex: number) => void;
  onRegenerateBlock: (blockIndex: number, userInstructions: string) => void;
  onManualBlockEdit: (blockIndex: number, updatedBlock: any) => void;
  onFieldsChange?: (fields: any[]) => void;
  onRegenerateSection?: (elementId: string, instructions: string) => void;
  saveStatus: 'saved' | 'saving' | 'error';
  onShowPreview: () => void;
  onDownloadPDF: () => void;
  isDownloadingPDF: boolean;
  isMobile?: boolean;
}

export const EnhancedContractView: React.FC<EnhancedContractViewProps> = ({
  contractJson,
  contractContent,
  currentParty,
  onSignatureClick,
  onRegenerateBlock,
  onManualBlockEdit,
  onFieldsChange,
  onRegenerateSection,
  saveStatus,
  onShowPreview,
  onDownloadPDF,
  isDownloadingPDF,
  isMobile = false
}) => {
  const [viewMode, setViewMode] = useState<'blocks' | 'document'>('blocks');
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);

  useEffect(() => {
    // Check if this is an uploaded document
    if (contractContent?.originalFormat) {
      setProcessedDocument(contractContent);
      setViewMode('document');
    } else if (contractJson) {
      setViewMode('blocks');
    }
  }, [contractContent, contractJson]);

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'p-4' : ''}`}>
      {/* View Mode Toggle */}
      {processedDocument && contractJson && (
        <div className="mb-4 flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('blocks')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'blocks' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Code className="w-4 h-4" />
              Block View
            </div>
          </button>
          <button
            onClick={() => setViewMode('document')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'document' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Document View
            </div>
          </button>
        </div>
      )}

      {/* Action Buttons with Save Status */}
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onShowPreview}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${
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

      {/* Contract Content */}
      <div className={`flex-1 overflow-y-auto ${!isMobile ? 'pb-4 pr-2' : ''}`}>
        {viewMode === 'document' && processedDocument ? (
          <DocumentViewer
            document={processedDocument}
            onFieldsChange={onFieldsChange}
            onRegenerateSection={onRegenerateSection}
            readOnly={false}
          />
        ) : contractJson ? (
          <div className="space-y-2">
            {contractJson.blocks?.map((block, i) => (
              <ContractBlock
                key={i}
                block={block}
                blockIndex={i}
                currentParty={currentParty}
                onSignatureClick={(signatureIndex: number) => onSignatureClick(i, signatureIndex)}
                onRegenerate={(userInstructions: string) => onRegenerateBlock(i, userInstructions)}
                onManualEdit={(updatedBlock: any) => onManualBlockEdit(i, updatedBlock)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="w-8 h-8" />
          </div>
        )}
      </div>
    </div>
  );
};