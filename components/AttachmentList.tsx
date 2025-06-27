import React from 'react';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  loading?: boolean;
  error?: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, onRemove }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === 'application/pdf') {
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
            ${attachment.error 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : attachment.loading
              ? 'bg-gray-100 text-gray-600 border border-gray-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }
          `}
        >
          <div className={`flex-shrink-0 ${attachment.error ? 'text-red-500' : 'text-gray-500'}`}>
            {attachment.loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              getFileIcon(attachment.type)
            )}
          </div>
          
          <span className="max-w-[200px] truncate">
            {attachment.name}
          </span>
          
          {!attachment.loading && (
            <span className="text-xs text-gray-500">
              {attachment.error ? 'Error' : formatFileSize(attachment.size)}
            </span>
          )}
          
          <button
            onClick={() => onRemove(attachment.id)}
            className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-600"
            disabled={attachment.loading}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;