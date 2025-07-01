// app/(protected)/contracts/upload/page.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DocumentProcessor, ProcessedDocument } from "@/lib/documentProcessor";
import DocumentViewer from "@/components/DocumentViewer";
import { Upload, FileText, AlertCircle } from "lucide-react";

export default function UploadContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [fieldValues, setFieldValues] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentProcessor = DocumentProcessor.getInstance();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const processed = await documentProcessor.processDocument(file);
      setProcessedDocument(processed);
      
      // Auto-detect fields count
      const fieldsCount = processed.elements.filter(el => el.type === 'field').length;
      if (fieldsCount > 0) {
        console.log(`Detected ${fieldsCount} input fields`);
      }
    } catch (err) {
      console.error('Error processing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Create a synthetic event for the file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFieldsChange = (fields: any[]) => {
    setFieldValues(fields);
  };

  const handleRegenerateSection = async (elementId: string, instructions: string) => {
    if (!processedDocument) return;
    
    try {
      const response = await fetch('/api/contracts/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: processedDocument,
          elementId,
          instructions
        })
      });
      
      if (response.ok) {
        const { updatedDocument } = await response.json();
        setProcessedDocument(updatedDocument);
      }
    } catch (error) {
      console.error('Error regenerating section:', error);
    }
  };

  const handleSaveContract = async () => {
    if (!processedDocument) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/contracts/save-uploaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: processedDocument,
          fieldValues
        })
      });
      
      if (response.ok) {
        const { contractId } = await response.json();
        router.push(`/contracts/${contractId}`);
      } else {
        throw new Error('Failed to save contract');
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      setError('Failed to save contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!processedDocument ? (
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Contract Document</h1>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your contract here or click to browse
            </h3>
            
            <p className="text-sm text-gray-500 mb-6">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Select File'}
            </button>
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 mb-2">Smart Field Detection</h4>
            <p className="text-sm text-blue-800">
              Our AI automatically detects signature fields, date fields, and other input areas in your document. 
              You can then fill them out digitally while preserving the original formatting.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setProcessedDocument(null)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold">Review & Edit Contract</h2>
                <p className="text-sm text-gray-500">
                  {processedDocument.elements.filter(el => el.type === 'field').length} fields detected
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSaveContract}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Save Contract
                </>
              )}
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <DocumentViewer
              document={processedDocument}
              onFieldsChange={handleFieldsChange}
              onRegenerateSection={handleRegenerateSection}
              readOnly={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}