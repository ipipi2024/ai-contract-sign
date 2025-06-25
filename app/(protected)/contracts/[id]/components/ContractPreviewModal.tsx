"use client";

import { ContractJson } from '../types/contract';
import { LoadingSpinner } from './LoadingSpinner';

interface ContractPreviewModalProps {
  contractJson: ContractJson;
  contractId: string;
  onClose: () => void;
  onDownloadPDF: () => void;
  isDownloadingPDF: boolean;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  contractJson,
  contractId,
  onClose,
  onDownloadPDF,
  isDownloadingPDF
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
              onClick={onDownloadPDF}
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
              onClick={onClose}
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
              <p className="text-gray-600">Contract ID: {contractId}</p>
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