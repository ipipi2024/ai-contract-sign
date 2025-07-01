// components/DocumentViewer/index.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProcessedDocument, DocumentElement } from '@/lib/documentProcessor';
import SignatureModal from '@/components/SignatureModal';
import { Calendar, Edit3, Type, CheckSquare, FileText, ZoomIn, ZoomOut, Download, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface FieldValue {
  elementId: string;
  value: string;
  type: string;
}

interface DocumentViewerProps {
  document: ProcessedDocument;
  onFieldsChange?: (fields: FieldValue[]) => void;
  onRegenerateSection?: (elementId: string, instructions: string) => void;
  readOnly?: boolean;
}

interface FieldGuide {
  elementId: string;
  label: string;
  required: boolean;
  completed: boolean;
  type: string;
  page: number;
}

export default function DocumentViewer({ 
  document, 
  onFieldsChange, 
  onRegenerateSection,
  readOnly = false 
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldValues, setFieldValues] = useState<Map<string, FieldValue>>(new Map());
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [zoom, setZoom] = useState(1);
  const [showFieldGuides, setShowFieldGuides] = useState(!readOnly);
  const [highlightFields, setHighlightFields] = useState(true);
  const [fitToWidth, setFitToWidth] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Use document's page size or default to US Letter
  const PAGE_WIDTH = document.pageSize?.width || 816;
  const PAGE_HEIGHT = document.pageSize?.height || 1056;

  // Calculate zoom to fit width
  useEffect(() => {
    if (fitToWidth && viewerRef.current && pageRef.current) {
      const viewerWidth = viewerRef.current.clientWidth - 64; // Subtract padding
      const newZoom = viewerWidth / PAGE_WIDTH;
      setZoom(Math.min(newZoom, 2)); // Cap at 200%
    }
  }, [fitToWidth, PAGE_WIDTH]);

  // Filter elements by current page
  const currentPageElements = document.elements.filter(
    el => el.position?.page === currentPage
  );

  // Get all fields for the field guide
  const getAllFields = useCallback((): FieldGuide[] => {
    const fields: FieldGuide[] = [];
    
    document.elements.forEach((element, index) => {
      if (element.type === 'field' && element.metadata && element.position) {
        const elementId = `element-${element.position.page}-${index}`;
        const fieldValue = fieldValues.get(elementId);
        fields.push({
          elementId,
          label: element.metadata.fieldName || 'Field',
          required: element.metadata.required || false,
          completed: !!fieldValue?.value,
          type: element.metadata.fieldType || 'text',
          page: element.position.page
        });
      }
    });
    
    // Sort by page and position
    return fields.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return 0;
    });
  }, [document.elements, fieldValues]);

  const handleFieldChange = (elementId: string, value: string, type: string) => {
    const newValue = { elementId, value, type };
    const newFieldValues = new Map(fieldValues);
    newFieldValues.set(elementId, newValue);
    setFieldValues(newFieldValues);
    
    if (onFieldsChange) {
      onFieldsChange(Array.from(newFieldValues.values()));
    }
  };

  const handleSignatureClick = (elementId: string) => {
    setCurrentSignatureField(elementId);
    setShowSignatureModal(true);
  };

  const handleSignatureSave = (signatureData: { img_url: string; name: string; date: string }) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, signatureData.img_url, 'signature');
      setShowSignatureModal(false);
      setCurrentSignatureField(null);
    }
  };

  const handleElementClick = (element: DocumentElement, elementId: string) => {
    if (readOnly) return;
    
    if (element.metadata?.fieldType === 'signature') {
      handleSignatureClick(elementId);
    } else if (element.type === 'paragraph' || element.type === 'heading' || element.type === 'text') {
      setSelectedElement(elementId);
    }
  };

  const handleElementDoubleClick = (element: DocumentElement, elementId: string) => {
    if (readOnly || element.type === 'field') return;
    
    setEditingElement(elementId);
    setEditText(element.content);
  };

  const handleEditSave = (elementId: string) => {
    // Here you would update the document element
    // For now, we'll just close the edit mode
    setEditingElement(null);
    setEditText('');
  };

  const handleRegenerate = () => {
    if (selectedElement && regenerateInstructions && onRegenerateSection) {
      onRegenerateSection(selectedElement, regenerateInstructions);
      setShowRegenerateModal(false);
      setRegenerateInstructions('');
    }
  };

  const handleZoomIn = () => {
    setFitToWidth(false);
    setZoom(Math.min(zoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setFitToWidth(false);
    setZoom(1);
  };

  const handleFitToWidth = () => {
    setFitToWidth(!fitToWidth);
  };

  const navigateToField = (elementId: string) => {
    const element = document.elements.find((el, index) => 
      `element-${el.position?.page || 1}-${index}` === elementId
    );
    
    if (element?.position) {
      setCurrentPage(element.position.page);
      setSelectedElement(elementId);
      
      // Scroll to element
      setTimeout(() => {
        const elementNode = window.document.getElementById(elementId);
        elementNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const renderElement = (element: DocumentElement, index: number) => {
    const elementId = `element-${currentPage}-${index}`;
    const globalIndex = document.elements.indexOf(element);
    const globalElementId = `element-${element.position?.page || 1}-${globalIndex}`;
    const isSelected = selectedElement === elementId || selectedElement === globalElementId;
    const isEditing = editingElement === elementId;
    const fieldValue = fieldValues.get(elementId) || fieldValues.get(globalElementId);
    
    if (!element.position) return null;
    
    // Apply zoom to position and size
    const scaledPosition = {
      x: element.position.x * zoom,
      y: element.position.y * zoom,
      width: element.position.width * zoom,
      height: element.position.height * zoom
    };
    
    // Base styles for ALL elements - this preserves the exact position
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${scaledPosition.x}px`,
      top: `${scaledPosition.y}px`,
      width: `${scaledPosition.width}px`,
      height: `${scaledPosition.height}px`,
      fontSize: `${(element.formatting?.fontSize || 12) * zoom}px`,
      fontFamily: element.formatting?.fontFamily || 'Arial, sans-serif',
      fontWeight: element.formatting?.bold ? 'bold' : 'normal',
      fontStyle: element.formatting?.italic ? 'italic' : 'normal',
      textAlign: element.formatting?.alignment || 'left',
      color: element.formatting?.color || '#000',
      lineHeight: 1,
      whiteSpace: 'pre', // Preserve spaces
      overflow: 'visible', // Allow text to render naturally
      ...(isSelected && !readOnly ? {
        outline: '2px solid #3b82f6',
        outlineOffset: '2px',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        zIndex: 10
      } : {})
    };

    if (element.type === 'field') {
      const { fieldType, fieldName, required, placeholder } = element.metadata || {};
      
      // Add field styling
      const fieldStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: !readOnly && !fieldValue?.value && highlightFields ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
        border: !readOnly && !fieldValue?.value && highlightFields ? '2px dashed #fbbf24' : 'none',
        borderRadius: '4px',
        cursor: readOnly ? 'default' : 'pointer'
      };
      
      switch (fieldType) {
        case 'signature':
          return (
            <div
              key={elementId}
              id={elementId}
              style={fieldStyle}
              onClick={() => !readOnly && handleSignatureClick(elementId)}
              className={`signature-field ${!readOnly ? 'hover:bg-blue-50' : ''}`}
            >
              {fieldValue?.value ? (
                <img 
                  src={fieldValue.value} 
                  alt="Signature" 
                  className="h-full w-full object-contain"
                />
              ) : !readOnly && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-2">
                    <Edit3 className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {placeholder || 'Click to sign'}
                      {required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
          
        case 'date':
          return (
            <div key={elementId} id={elementId} style={baseStyle}>
              <input
                type="date"
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(elementId, e.target.value, 'date')}
                className="w-full h-full px-2 border border-gray-300 rounded bg-white"
                style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
                disabled={readOnly}
                required={required}
              />
            </div>
          );
          
        case 'checkbox':
          return (
            <div key={elementId} id={elementId} style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={fieldValue?.value === 'true'}
                onChange={(e) => handleFieldChange(elementId, e.target.checked.toString(), 'checkbox')}
                className="w-4 h-4"
                style={{ transform: `scale(${zoom})` }}
                disabled={readOnly}
              />
            </div>
          );
          
        case 'initial':
          return (
            <div key={elementId} id={elementId} style={baseStyle}>
              <input
                type="text"
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(elementId, e.target.value.slice(0, 3).toUpperCase(), 'initial')}
                placeholder={placeholder || 'Initial'}
                maxLength={3}
                className="w-full h-full px-2 border border-gray-300 rounded text-center bg-white font-bold uppercase"
                style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
                disabled={readOnly}
                required={required}
              />
            </div>
          );
          
        default:
          return (
            <div key={elementId} id={elementId} style={baseStyle}>
              <input
                type="text"
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(elementId, e.target.value, 'text')}
                placeholder={placeholder}
                className="w-full h-full px-2 border border-gray-300 rounded bg-white"
                style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
                disabled={readOnly}
                required={required}
              />
            </div>
          );
      }
    }
    
    // Regular text elements - render exactly as they are
    if (isEditing) {
      return (
        <div key={elementId} id={elementId} style={baseStyle}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => handleEditSave(elementId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleEditSave(elementId);
              }
            }}
            className="w-full h-full p-1 border border-blue-500 rounded resize-none focus:outline-none bg-white"
            style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
            autoFocus
          />
        </div>
      );
    }
    
    return (
      <div
        key={elementId}
        id={elementId}
        style={baseStyle}
        onClick={() => handleElementClick(element, elementId)}
        onDoubleClick={() => handleElementDoubleClick(element, elementId)}
        className={`${!readOnly && (element.type === 'paragraph' || element.type === 'heading') ? 'hover:bg-gray-50 hover:bg-opacity-50 cursor-pointer' : ''}`}
      >
        {element.content}
      </div>
    );
  };

  const fields = getAllFields();
  const completedFields = fields.filter(f => f.completed).length;
  const totalFields = fields.length;
  const requiredFields = fields.filter(f => f.required);
  const completedRequired = requiredFields.filter(f => f.completed).length;

  // Group fields by page
  const fieldsByPage = fields.reduce((acc, field) => {
    const page = field.page;
    if (!acc[page]) acc[page] = [];
    acc[page].push(field);
    return acc;
  }, {} as Record<number, FieldGuide[]>);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Field Guide */}
      {!readOnly && showFieldGuides && totalFields > 0 && (
        <div className="w-80 bg-white border-r shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-2">Document Fields</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{completedFields} of {totalFields}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedFields / totalFields) * 100}%` }}
                />
              </div>
              {requiredFields.length > 0 && (
                <div className="text-xs text-gray-500">
                  {completedRequired} of {requiredFields.length} required fields completed
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {Object.entries(fieldsByPage).map(([page, pageFields]) => (
                <div key={page}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Page {page}
                  </h4>
                  <div className="space-y-2">
                    {pageFields.map((field) => (
                      <button
                        key={field.elementId}
                        onClick={() => navigateToField(field.elementId)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          field.completed 
                            ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {field.completed ? (
                              <CheckSquare className="w-4 h-4 text-green-600" />
                            ) : (
                              <div className={`w-4 h-4 border-2 rounded ${
                                field.required ? 'border-red-400' : 'border-gray-300'
                              }`} />
                            )}
                            <span className={`text-sm ${field.completed ? 'text-gray-700' : 'text-gray-900'}`}>
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{field.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {document.pages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(document.pages, currentPage + 1))}
                disabled={currentPage === document.pages}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              {/* Zoom controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors min-w-[60px]"
                  title="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 2}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFitToWidth}
                  className={`p-1 rounded transition-colors ${
                    fitToWidth ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  title="Fit to width"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              {!readOnly && (
                <>
                  <button
                    onClick={() => setShowFieldGuides(!showFieldGuides)}
                    className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${
                      showFieldGuides ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Field Guide
                  </button>
                  
                  <button
                    onClick={() => setHighlightFields(!highlightFields)}
                    className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${
                      highlightFields ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {highlightFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Highlight Fields
                  </button>
                </>
              )}
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{document.originalFormat.toUpperCase()}</span>
              </div>
            </div>
            
            {!readOnly && selectedElement && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingElement(selectedElement)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
                >
                  <Type className="w-4 h-4" />
                  Edit
                </button>
                {onRegenerateSection && (
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    AI Regenerate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Document Viewer */}
        <div ref={viewerRef} className="flex-1 overflow-auto p-8 bg-gray-100">
          <div 
            ref={pageRef}
            className="bg-white shadow-lg mx-auto relative"
            style={{
              width: `${PAGE_WIDTH * zoom}px`,
              height: `${PAGE_HEIGHT * zoom}px`
            }}
          >
            {/* Render all elements */}
            {currentPageElements.map((element, index) => renderElement(element, index))}
          </div>
        </div>
      </div>
      
      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          onClose={() => {
            setShowSignatureModal(false);
            setCurrentSignatureField(null);
          }}
          onSave={handleSignatureSave}
        />
      )}
      
      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowRegenerateModal(false)}></div>
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">AI Regenerate Section</h3>
            <textarea
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              placeholder="Describe how you want to modify this section..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={!regenerateInstructions.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}