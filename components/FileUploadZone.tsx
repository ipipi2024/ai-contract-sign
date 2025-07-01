//components/FileUploadZone.tsx
import React, { useState, DragEvent, useEffect } from 'react';

interface FileUploadZoneProps {
  onFileSelect: (files: FileList | File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  attachments: any[];
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileSelect, fileInputRef, attachments }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setDragCounter(prev => prev + 1);
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragging(false);
        }
        return newCounter;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files);
      }
    };

    // Add event listeners to the document
    document.addEventListener('dragenter', handleDragEnter as any);
    document.addEventListener('dragleave', handleDragLeave as any);
    document.addEventListener('dragover', handleDragOver as any);
    document.addEventListener('drop', handleDrop as any);

    // Cleanup
    return () => {
      document.removeEventListener('dragenter', handleDragEnter as any);
      document.removeEventListener('dragleave', handleDragLeave as any);
      document.removeEventListener('dragover', handleDragOver as any);
      document.removeEventListener('drop', handleDrop as any);
    };
  }, [onFileSelect]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-auto" />
      <div className="flex items-center justify-center h-full p-8">
        <div className="bg-white rounded-lg shadow-xl p-12 max-w-lg w-full pointer-events-auto border-2 border-dashed border-blue-400">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-blue-500 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-xl font-medium text-gray-900 mb-2">
              Drop files to upload
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOCX, TXT, MD, JPG, PNG up to 10MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;