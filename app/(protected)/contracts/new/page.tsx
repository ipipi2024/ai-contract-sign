"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractBlock from "@/components/ContractBlock";
import SignatureModal from "@/components/SignatureModal";
import ContractSummary from "@/components/ContractSummary";
import { server_log } from '@/app/actions/log';
import FileUploadZone from "@/components/FileUploadZone";
import AttachmentList from "@/components/AttachmentList";
import { parseDocument } from "@/lib/documentParser";

import Link from "next/link";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  loading?: boolean;
  error?: string;
}

const ErrorModal = ({ isOpen, onClose, title, message }: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black opacity-50"></div>
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

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const handleFileSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file
      if (!SUPPORTED_TYPES.includes(file.type)) {
        setError({
          title: "Unsupported File Type",
          message: `"${file.name}" is not a supported file type. Please upload PDF, DOCX, TXT, MD, JPG, or PNG files.`
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError({
          title: "File Too Large",
          message: `"${file.name}" exceeds the 10MB file size limit.`
        });
        continue;
      }

      // Add file to attachments with loading state
      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        loading: true
      };

      setAttachments(prev => [...prev, attachment]);

      try {
        // Parse the document
        const content = await parseDocument(file);
        
        setAttachments(prev => 
          prev.map(att => 
            att.id === attachment.id 
              ? { ...att, content, loading: false }
              : att
          )
        );
      } catch (error) {
        setAttachments(prev => 
          prev.map(att => 
            att.id === attachment.id 
              ? { ...att, loading: false, error: "Failed to parse document" }
              : att
          )
        );
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // If pasted content is longer than 1000 characters, automatically make it an attachment
    if (pastedText.length > 1000) {
      e.preventDefault();
      
      const attachment: Attachment = {
        id: `paste-${Date.now()}`,
        name: `Pasted content ${new Date().toLocaleTimeString()}.txt`,
        size: new Blob([pastedText]).size,
        type: 'text/plain',
        content: pastedText
      };
      
      setAttachments(prev => [...prev, attachment]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const buildCombinedPrompt = () => {
    let combinedPrompt = prompt.trim();
    
    if (attachments.length > 0) {
      combinedPrompt += "\n\n--- Attached Documents ---\n\n";
      
      attachments.forEach((attachment, index) => {
        if (attachment.content && !attachment.error) {
          combinedPrompt += `Document ${index + 1}: ${attachment.name}\n`;
          combinedPrompt += "---\n";
          combinedPrompt += attachment.content;
          combinedPrompt += "\n\n";
        }
      });
    }
    
    return combinedPrompt;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasValidAttachments = attachments.some(att => att.content && !att.error);
    
    if (!prompt.trim() && !hasValidAttachments) {
      setError({
        title: "Missing Description",
        message: "Please enter a description of the contract you need or upload relevant documents."
      });
      return;
    }

    // Check if any attachments are still loading
    if (attachments.some(att => att.loading)) {
      setError({
        title: "Files Still Processing",
        message: "Please wait for all files to finish processing before generating the contract."
      });
      return;
    }

    setLoading(true);

    try {
      const combinedPrompt = buildCombinedPrompt();
      
      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: combinedPrompt,
        }),
      });

      if (response.ok) {
        const { contract } = await response.json();
        server_log(contract);
        router.push(`/contracts/${contract._id}`);
      } else {
        const errorData = await response.json();
        setError({
          title: "Contract Generation Failed",
          message: errorData.message || "Failed to generate contract. Please try again."
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setError({
        title: "Error",
        message: "An error occurred while generating the contract. Please try again."
      });
    } finally {
      // Never set loading to false, it makes for weird UX, because the button stops loading for a litle before the page moves on.
      // setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Generate Contract with AI
            </h1>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
          >
            {/* Contract Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Contract
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  className="w-full p-4 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-40 resize-none"
                  placeholder="Create a freelance contract between ABC Corp and John Smith for website development. $5,000 payment in two milestones, 6-week timeline, includes hosting setup and training."
                />
                {/* Attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Attach files"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-2 flex justify-between items-center">
                <span>{prompt.length} characters</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload files
                  </button>
                  <span className="text-gray-400">•</span>
                  <span>PDF, DOCX, TXT, Images</span>
                </div>
              </div>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <AttachmentList
                attachments={attachments}
                onRemove={removeAttachment}
              />
            )}

            {/* File Upload Zone - Only show when dragging */}
            <FileUploadZone
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              attachments={attachments}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || (!prompt.trim() && attachments.length === 0)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating Contract...
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-purple-900">
                    AI-Powered Contract Generation
                  </h4>
                  <ul className="text-sm text-purple-700 mt-2 list-disc list-inside space-y-1">
                    <li>Identifies the contract type and structure</li>
                    <li>Extracts party information and roles</li>
                    <li>Generates appropriate legal clauses</li>
                    <li>Includes standard terms and conditions</li>
                    <li>Adds dispute resolution and termination clauses</li>
                    <li>Analyzes uploaded documents for context</li>
                  </ul>
                </div>
              </div>
            </div>

            
          </form>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title={error?.title || ""}
        message={error?.message || ""}
      />
    </>
  );
}