// components/ContractBlock.js
"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";

export default function ContractBlock({
  block,
  blockIndex,
  currentParty,
  onSignatureClick,
  onRegenerate,
  onManualEdit,
}) {
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [editedText, setEditedText] = useState(block.text);

  const renderBlockText = () => {
    const text = block.text;
    const parts = [];
    let lastIndex = 0;
    let whichSignature = 0;
    const underscorePattern = /_{20}/g;
    let match;

    while ((match = underscorePattern.exec(text)) !== null) {
      // Add text before the signature
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text_${blockIndex}_${whichSignature}`} className="whitespace-pre-wrap">
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }

      const signature = block.signatures[whichSignature];
      const isCurrentParty = signature?.party === currentParty;
      const bgClass = isCurrentParty ? 'bg-blue-50' : 'bg-red-50';
      const currentSignatureIndex = whichSignature;

      // Create signature field with name, signature, and date lines
      parts.push(
        <div
          key={`signature_${blockIndex}_${whichSignature}`}
          className={`relative inline-block ${bgClass} rounded p-2 font-mono transition-colors duration-150 ${
            isCurrentParty ? 'cursor-pointer hover:bg-blue-100' : 'cursor-not-allowed'
          }`}
          data-index={whichSignature}
          data-party={signature?.party || "PartyA"}
          onClick={(e) => {
            e.stopPropagation();
            if (isCurrentParty) {
              onSignatureClick(currentSignatureIndex);
            }
          }}
        >
          <div className="space-y-3">
            <div className="text-md">
              Name: {signature?.name ? (
                <span className="font-normal">{signature.name}</span>
              ) : (
                <span className="text-gray-400">_______________</span>
              )}
            </div>
            <div className="text-md">
              Signature: {signature?.img_url ? (
                <img 
                  src={signature.img_url} 
                  alt="Signature" 
                  className="inline-block h-12 max-w-64 object-contain"
                />
              ) : (
                <span className="text-gray-400">_______________</span>
              )}
            </div>
            <div className="text-md">
              Date: {signature?.date ? (
                <span className="font-normal">{signature.date}</span>
              ) : (
                <span className="text-gray-400">_______________</span>
              )}
            </div>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
      whichSignature++;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`rest_${blockIndex}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const handleRegenerateSubmit = () => {
    if (regenPrompt.trim()) {
      onRegenerate(regenPrompt.trim());
      setShowRegenerateModal(false);
      setRegenPrompt("");
    }
  };

  const handleManualEditSave = () => {
    // Create a new block object with the edited text but preserve signatures
    const updatedBlock = {
      ...block,
      text: editedText
    };
    onManualEdit(updatedBlock);
    setShowRegenerateModal(false);
  };

  return (
    <div className="mb-1">
      <div
        className="p-4 mb-2 rounded border border-transparent hover:border-gray-300 cursor-pointer transition relative"
        onClick={(e) => {
          // Check if the click target is a signature span or its child
          const clickedElement = e.target;
          const isSignatureClick = clickedElement.closest('[data-type]') !== null;
          
          // Only open regenerate modal if it wasn't a signature click
          if (!isSignatureClick) {
            setShowRegenerateModal(true);
          }
        }}
      >
        {renderBlockText()}
      </div>

      <Dialog
        open={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        className="fixed z-10 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
          <DialogPanel className="relative bg-white rounded-lg max-w-4xl w-full p-6">
            <DialogTitle className="text-xl font-semibold mb-4 text-center">
              <span className="inline-block px-4 py-2 bg-gray-100 rounded-lg text-black">
                Edit Block
              </span>
            </DialogTitle>
            
            {/* Manual Editing Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Manual Editing</h3>
              <textarea
                rows={8}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleManualEditSave}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition text-sm"
                >
                  Save Edits
                </button>
              </div>
            </div>

            {/* Regenerate Section */}
            <div className="pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Regenerate with AI</h3>
              <textarea
                rows={4}
                value={regenPrompt}
                onChange={(e) => setRegenPrompt(e.target.value)}
                placeholder="Tell me how to update this block..."
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-sm mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleRegenerateSubmit();
                  }
                }}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleRegenerateSubmit}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition text-sm"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRegenerateModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              &#x2715;
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
