// lib/documentProcessor/index.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker based on environment
if (typeof window !== 'undefined') {
  // Browser environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} else {
  // Node.js/Server environment - disable worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  (pdfjsLib as any).GlobalWorkerOptions.isEvalSupported = false;
  (pdfjsLib as any).GlobalWorkerOptions.disableWorker = true;
}

export interface DocumentElement {
  type: 'text' | 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'field';
  content: string;
  formatting: {
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    indent?: number;
    lineHeight?: number;
  };
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
  metadata?: {
    fieldType?: 'text' | 'signature' | 'date' | 'checkbox' | 'initial';
    fieldName?: string;
    required?: boolean;
    placeholder?: string;
    originalText?: string;
  };
}

export interface ProcessedDocument {
  elements: DocumentElement[];
  pages: number;
  originalFormat: 'pdf' | 'docx' | 'txt';
  pageSize: {
    width: number;
    height: number;
  };
  metadata: {
    title?: string;
    author?: string;
    createdDate?: Date;
  };
}

interface TextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
  fontName?: string;
  dir?: string;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;
  
  private static readonly FIELD_PATTERNS = [
    // Signature fields
    { regex: /_{10,}|_+\s*\[signature\]|signature:\s*_{5,}/i, type: 'signature' as const, name: 'Signature' },
    { regex: /\[sign here\]|\{signature\}|\[signature\]/i, type: 'signature' as const, name: 'Signature' },
    { regex: /sign:\s*_{5,}|signed:\s*_{5,}/i, type: 'signature' as const, name: 'Signature' },
    { regex: /X\s*_{10,}/i, type: 'signature' as const, name: 'Signature' },
    
    // Date fields
    { regex: /date:\s*_{5,}|_+\s*\[date\]|\{date\}/i, type: 'date' as const, name: 'Date' },
    { regex: /\[mm\/dd\/yyyy\]|\[dd\/mm\/yyyy\]|\[date\]/i, type: 'date' as const, name: 'Date' },
    { regex: /dated:\s*_{5,}/i, type: 'date' as const, name: 'Date' },
    
    // Name fields
    { regex: /name:\s*_{5,}|_+\s*\[name\]|\{name\}/i, type: 'text' as const, name: 'Name' },
    { regex: /\[full name\]|\[print name\]|\[name\]/i, type: 'text' as const, name: 'Full Name' },
    { regex: /print name:\s*_{5,}/i, type: 'text' as const, name: 'Print Name' },
    
    // Initial fields
    { regex: /initial:\s*_{3,}|_+\s*\[initial\]|\{initial\}/i, type: 'initial' as const, name: 'Initial' },
    { regex: /\[initial\]/i, type: 'initial' as const, name: 'Initial' },
    
    // Checkbox fields
    { regex: /\[\s*\]|\( \)|\{checkbox\}/i, type: 'checkbox' as const, name: 'Checkbox' },
    { regex: /☐|□|▢|⬜/i, type: 'checkbox' as const, name: 'Checkbox' },
    
    // Generic text fields with underscores (must be last)
    { regex: /_{5,}/, type: 'text' as const, name: 'Text Field' },
    
    // Generic bracketed fields
    { regex: /\[([^\]]+)\]|\{([^}]+)\}/, type: 'text' as const, name: 'Text Field' }
  ];

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  async processDocument(file: File): Promise<ProcessedDocument> {
    const fileType = file.type;
    
    switch (fileType) {
      case 'application/pdf':
        return this.processPDF(file);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.processDOCX(file);
      case 'text/plain':
        return this.processTXT(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async processPDF(file: File): Promise<ProcessedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configure loading options for server environment
    const loadingOptions: any = {
      data: arrayBuffer,
      // Disable features that require DOM or workers in server environment
      disableWorker: typeof window === 'undefined',
      disableStream: typeof window === 'undefined',
      disableAutoFetch: typeof window === 'undefined',
      disableFontFace: typeof window === 'undefined',
      isEvalSupported: typeof window !== 'undefined',
    };
    
    try {
      const pdf = await pdfjsLib.getDocument(loadingOptions).promise;
      const elements: DocumentElement[] = [];
      
      // Get page dimensions from first page
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.0 });
      const pageSize = {
        width: viewport.width,
        height: viewport.height
      };
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Process each text item individually, preserving exact position
        const items = textContent.items as TextItem[];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.str || item.str.trim() === '') continue;
          
          // Extract exact position from transform matrix
          const x = item.transform[4];
          const y = viewport.height - item.transform[5]; // Convert to top-down coordinates
          const fontSize = Math.abs(item.transform[0]);
          const width = item.width || (item.str.length * fontSize * 0.5);
          const height = fontSize * 1.2;
          
          // Check if this text contains a field
          const fieldInfo = this.detectFieldInLine(item.str);
          
          if (fieldInfo && !fieldInfo.isValue) {
            // Check if this is a complete field line or part of a larger text
            const isCompleteField = this.isCompleteField(item.str, fieldInfo);
            
            if (isCompleteField) {
              // Handle as a complete field
              const element: DocumentElement = {
                type: 'field',
                content: '',
                formatting: {
                  fontSize: fontSize,
                  fontFamily: this.getFontFamily(item.fontName)
                },
                position: {
                  x: x + (fieldInfo.offsetX || 0),
                  y: y,
                  width: this.getFieldWidth(fieldInfo.type),
                  height: this.getFieldHeight(fieldInfo.type),
                  page: pageNum
                },
                metadata: {
                  fieldType: fieldInfo.type,
                  fieldName: fieldInfo.name,
                  required: fieldInfo.required,
                  placeholder: fieldInfo.placeholder || fieldInfo.name,
                  originalText: item.str
                }
              };
              elements.push(element);
            } else {
              // Handle mixed text and field
              const parts = this.splitTextByField(item.str, fieldInfo);
              let currentX = x;
              
              for (const part of parts) {
                if (part.isField) {
                  elements.push({
                    type: 'field',
                    content: '',
                    formatting: {
                      fontSize: fontSize,
                      fontFamily: this.getFontFamily(item.fontName)
                    },
                    position: {
                      x: currentX,
                      y: y,
                      width: this.getFieldWidth(fieldInfo.type),
                      height: this.getFieldHeight(fieldInfo.type),
                      page: pageNum
                    },
                    metadata: {
                      fieldType: fieldInfo.type,
                      fieldName: fieldInfo.name,
                      required: fieldInfo.required,
                      placeholder: fieldInfo.placeholder || fieldInfo.name,
                      originalText: part.text
                    }
                  });
                  currentX += this.getFieldWidth(fieldInfo.type);
                } else if (part.text.trim()) {
                  // Add text before or after field
                  const textWidth = part.text.length * fontSize * 0.5;
                  elements.push({
                    type: 'text',
                    content: part.text,
                    formatting: {
                      fontSize: fontSize,
                      fontFamily: this.getFontFamily(item.fontName),
                      bold: item.fontName?.toLowerCase().includes('bold') || false,
                      italic: item.fontName?.toLowerCase().includes('italic') || false,
                      color: '#000000'
                    },
                    position: {
                      x: currentX,
                      y: y,
                      width: textWidth,
                      height: height,
                      page: pageNum
                    }
                  });
                  currentX += textWidth;
                }
              }
            }
          } else {
            // Regular text - preserve exact position and formatting
            const element: DocumentElement = {
              type: 'text',
              content: item.str,
              formatting: {
                fontSize: fontSize,
                fontFamily: this.getFontFamily(item.fontName),
                bold: item.fontName?.toLowerCase().includes('bold') || false,
                italic: item.fontName?.toLowerCase().includes('italic') || false,
                color: '#000000'
              },
              position: {
                x: x,
                y: y,
                width: width,
                height: height,
                page: pageNum
              }
            };
            elements.push(element);
          }
        }
        
        // Clean up page resources
        page.cleanup();
      }
      
      return {
        elements: elements,
        pages: pdf.numPages,
        originalFormat: 'pdf',
        pageSize,
        metadata: {
          title: file.name
        }
      };
    } catch (error) {
      console.error('Error processing PDF with pdfjs-dist:', error);
      // Fallback to pdf-lib for basic processing
      return this.processPDFWithPdfLib(file, arrayBuffer);
    }
  }

  // Fallback method using pdf-lib
  private async processPDFWithPdfLib(file: File, arrayBuffer: ArrayBuffer): Promise<ProcessedDocument> {
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      return {
        elements: [],
        pages: pages.length,
        originalFormat: 'pdf',
        pageSize: { width, height },
        metadata: {
          title: pdfDoc.getTitle() || file.name,
          author: pdfDoc.getAuthor(),
          createdDate: pdfDoc.getCreationDate()
        }
      };
    } catch (error) {
      console.error('Error processing PDF with pdf-lib:', error);
      throw new Error('Failed to process PDF document');
    }
  }

  private detectFieldInLine(text: string): {
    type: 'text' | 'signature' | 'date' | 'checkbox' | 'initial';
    name: string;
    required: boolean;
    placeholder?: string;
    isValue?: boolean;
    matchIndex?: number;
    matchLength?: number;
    offsetX?: number;
  } | null {
    for (const pattern of DocumentProcessor.FIELD_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        // Extract field name from brackets if available
        let fieldName = pattern.name;
        if (pattern.regex.source.includes('[^\\]]+')) {
          const nameMatch = text.match(/\[([^\]]+)\]|\{([^}]+)\}/);
          if (nameMatch) {
            fieldName = nameMatch[1] || nameMatch[2] || pattern.name;
          }
        }
        
        // Calculate offset for fields that appear after text (e.g., "Name: _____")
        let offsetX = 0;
        if (match.index && match.index > 0) {
          // Estimate the width of text before the field
          const textBefore = text.substring(0, match.index);
          offsetX = textBefore.length * 7; // Rough estimate, will be refined based on font size
        }
        
        return {
          type: pattern.type,
          name: fieldName,
          required: text.includes('*') || text.toLowerCase().includes('required'),
          placeholder: fieldName,
          isValue: false,
          matchIndex: match.index,
          matchLength: match[0].length,
          offsetX: offsetX
        };
      }
    }
    
    return null;
  }

  private isCompleteField(text: string, fieldInfo: any): boolean {
    // Check if the entire text is just the field pattern
    const fieldPattern = text.substring(fieldInfo.matchIndex, fieldInfo.matchIndex + fieldInfo.matchLength);
    const trimmedText = text.trim();
    
    // If the field pattern is the entire text, it's a complete field
    if (fieldPattern.trim() === trimmedText) {
      return true;
    }
    
    // If it's a checkbox or initial field at the start, consider it complete
    if (['checkbox', 'initial'].includes(fieldInfo.type) && fieldInfo.matchIndex === 0) {
      return true;
    }
    
    // For other fields, check if there's significant text before or after
    const textBefore = text.substring(0, fieldInfo.matchIndex).trim();
    const textAfter = text.substring(fieldInfo.matchIndex + fieldInfo.matchLength).trim();
    
    // If there's only a label before (like "Name:" or "Date:"), consider it mixed
    if (textBefore.match(/^[A-Za-z\s]+:?\s*$/) && !textAfter) {
      return false;
    }
    
    return !textBefore && !textAfter;
  }

  private splitTextByField(text: string, fieldInfo: any): any[] {
    const parts: any[] = [];
    
    if (fieldInfo.matchIndex !== undefined && fieldInfo.matchIndex >= 0) {
      const matchStart = fieldInfo.matchIndex;
      const matchEnd = matchStart + fieldInfo.matchLength;
      
      // Text before field
      const beforeText = text.substring(0, matchStart);
      if (beforeText) {
        parts.push({
          text: beforeText,
          isField: false
        });
      }
      
      // Field itself
      parts.push({
        text: text.substring(matchStart, matchEnd),
        isField: true
      });
      
      // Text after field
      const afterText = text.substring(matchEnd);
      if (afterText) {
        parts.push({
          text: afterText,
          isField: false
        });
      }
    }
    
    return parts;
  }

  private getFontFamily(fontName?: string): string {
    if (!fontName) return 'Arial, sans-serif';
    
    const fontMap: { [key: string]: string } = {
      'Times': 'Times New Roman, serif',
      'Helvetica': 'Helvetica, Arial, sans-serif',
      'Courier': 'Courier New, monospace',
      'Symbol': 'Symbol',
      'ZapfDingbats': 'ZapfDingbats'
    };
    
    for (const [key, value] of Object.entries(fontMap)) {
      if (fontName.includes(key)) {
        return value;
      }
    }
    
    return 'Arial, sans-serif';
  }

  private getFieldWidth(fieldType: string): number {
    switch (fieldType) {
      case 'signature':
        return 250;
      case 'date':
        return 120;
      case 'checkbox':
        return 20;
      case 'initial':
        return 80;
      default:
        return 200;
    }
  }

  private getFieldHeight(fieldType: string): number {
    switch (fieldType) {
      case 'signature':
        return 80;
      case 'checkbox':
        return 20;
      case 'initial':
        return 40;
      default:
        return 30;
    }
  }

  // Simplified DOCX processing
  private async processDOCX(file: File): Promise<ProcessedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // In server environment, we can't use DOMParser
    if (typeof window === 'undefined') {
      // Simple text extraction for server-side
      const text = result.value.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
      const lines = text.split('\n').filter(line => line.trim());
      
      const elements: DocumentElement[] = [];
      let pageNum = 1;
      let yPosition = 72;
      const pageHeight = 1056;
      const pageWidth = 816;
      
      for (const line of lines) {
        if (yPosition + 20 > pageHeight - 72) {
          pageNum++;
          yPosition = 72;
        }
        
        elements.push({
          type: 'paragraph',
          content: line,
          formatting: {
            fontSize: 12,
            fontFamily: 'Arial'
          },
          position: {
            x: 72,
            y: yPosition,
            width: pageWidth - 144,
            height: 20,
            page: pageNum
          }
        });
        
        yPosition += 25;
      }
      
      return {
        elements,
        pages: pageNum,
        originalFormat: 'docx',
        pageSize: { width: pageWidth, height: pageHeight },
        metadata: { title: file.name }
      };
    }
    
    // Browser environment - use DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    const elements: DocumentElement[] = [];
    
    let pageNum = 1;
    let yPosition = 72; // 1 inch margin
    const pageHeight = 1056;
    const pageWidth = 816;
    
    // Process all text nodes
    const textNodes = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th');
    
    for (const node of Array.from(textNodes)) {
      const text = node.textContent?.trim() || '';
      if (!text) continue;
      
      const tagName = node.tagName.toLowerCase();
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
      const fontSize = isHeading ? this.getHeadingSize(tagName) : 12;
      const lineHeight = fontSize * 1.5;
      
      // Check for page break
      if (yPosition + lineHeight > pageHeight - 72) {
        pageNum++;
        yPosition = 72;
      }
      
      const fieldInfo = this.detectFieldInLine(text);
      
      if (fieldInfo && !fieldInfo.isValue) {
        const isComplete = this.isCompleteField(text, fieldInfo);
        
        if (isComplete) {
          const element: DocumentElement = {
            type: 'field',
            content: '',
            formatting: { fontSize },
            position: {
              x: 72,
              y: yPosition,
              width: this.getFieldWidth(fieldInfo.type),
              height: this.getFieldHeight(fieldInfo.type),
              page: pageNum
            },
            metadata: {
              fieldType: fieldInfo.type,
              fieldName: fieldInfo.name,
              required: fieldInfo.required,
              placeholder: fieldInfo.placeholder
            }
          };
          elements.push(element);
        } else {
          // Handle mixed content
          const parts = this.splitTextByField(text, fieldInfo);
          let xOffset = 72;
          
          for (const part of parts) {
            if (part.isField) {
              elements.push({
                type: 'field',
                content: '',
                formatting: { fontSize },
                position: {
                  x: xOffset,
                  y: yPosition,
                  width: this.getFieldWidth(fieldInfo.type),
                  height: this.getFieldHeight(fieldInfo.type),
                  page: pageNum
                },
                metadata: {
                  fieldType: fieldInfo.type,
                  fieldName: fieldInfo.name,
                  required: fieldInfo.required,
                  placeholder: fieldInfo.placeholder
                }
              });
              xOffset += this.getFieldWidth(fieldInfo.type) + 5;
            } else if (part.text.trim()) {
              const textWidth = part.text.length * fontSize * 0.5;
              elements.push({
                type: isHeading ? 'heading' : 'paragraph',
                content: part.text,
                formatting: {
                  fontSize,
                  fontFamily: 'Arial',
                  bold: isHeading,
                  alignment: 'left'
                },
                position: {
                  x: xOffset,
                  y: yPosition,
                  width: textWidth,
                  height: lineHeight,
                  page: pageNum
                }
              });
              xOffset += textWidth;
            }
          }
        }
      } else {
        const element: DocumentElement = {
          type: isHeading ? 'heading' : 'paragraph',
          content: text,
          formatting: {
            fontSize,
            fontFamily: 'Arial',
            bold: isHeading,
            alignment: 'left'
          },
          position: {
            x: 72,
            y: yPosition,
            width: pageWidth - 144, // Account for margins
            height: lineHeight,
            page: pageNum
          }
        };
        elements.push(element);
      }
      
      yPosition += lineHeight + (tagName === 'p' ? 12 : 6);
    }
    
    return {
      elements: elements,
      pages: pageNum,
      originalFormat: 'docx',
      pageSize: { width: pageWidth, height: pageHeight },
      metadata: {
        title: file.name
      }
    };
  }

  // Simplified TXT processing
  private async processTXT(file: File): Promise<ProcessedDocument> {
    const text = await file.text();
    const lines = text.split('\n');
    const elements: DocumentElement[] = [];
    
    let pageNum = 1;
    let yPosition = 72;
    const pageHeight = 1056;
    const pageWidth = 816;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    
    for (const line of lines) {
      if (yPosition + lineHeight > pageHeight - 72) {
        pageNum++;
        yPosition = 72;
      }
      
      if (!line.trim()) {
        yPosition += lineHeight / 2;
        continue;
      }
      
      const fieldInfo = this.detectFieldInLine(line);
      
      if (fieldInfo && !fieldInfo.isValue) {
        const isComplete = this.isCompleteField(line, fieldInfo);
        
        if (isComplete) {
          const element: DocumentElement = {
            type: 'field',
            content: '',
            formatting: { fontSize, fontFamily: 'Arial' },
            position: {
              x: 72,
              y: yPosition,
              width: this.getFieldWidth(fieldInfo.type),
              height: this.getFieldHeight(fieldInfo.type),
              page: pageNum
            },
            metadata: {
              fieldType: fieldInfo.type,
              fieldName: fieldInfo.name,
              required: fieldInfo.required,
              placeholder: fieldInfo.placeholder
            }
          };
          elements.push(element);
        } else {
          // Handle mixed content
          const parts = this.splitTextByField(line, fieldInfo);
          let xOffset = 72;
          
          for (const part of parts) {
            if (part.isField) {
              elements.push({
                type: 'field',
                content: '',
                formatting: { fontSize, fontFamily: 'Arial' },
                position: {
                  x: xOffset,
                  y: yPosition,
                  width: this.getFieldWidth(fieldInfo.type),
                  height: this.getFieldHeight(fieldInfo.type),
                  page: pageNum
                },
                metadata: {
                  fieldType: fieldInfo.type,
                  fieldName: fieldInfo.name,
                  required: fieldInfo.required,
                  placeholder: fieldInfo.placeholder
                }
              });
              xOffset += this.getFieldWidth(fieldInfo.type) + 5;
            } else if (part.text.trim()) {
              const textWidth = part.text.length * fontSize * 0.5;
              elements.push({
                type: 'paragraph',
                content: part.text,
                formatting: { fontSize, fontFamily: 'Arial' },
                position: {
                  x: xOffset,
                  y: yPosition,
                  width: textWidth,
                  height: lineHeight,
                  page: pageNum
                }
              });
              xOffset += textWidth;
            }
          }
        }
      } else {
        const element: DocumentElement = {
          type: 'paragraph',
          content: line,
          formatting: { fontSize, fontFamily: 'Arial' },
          position: {
            x: 72,
            y: yPosition,
            width: pageWidth - 144,
            height: lineHeight,
            page: pageNum
          }
        };
        elements.push(element);
      }
      
      yPosition += lineHeight;
    }
    
    return {
      elements: elements,
      pages: pageNum,
      originalFormat: 'txt',
      pageSize: { width: pageWidth, height: pageHeight },
      metadata: {
        title: file.name
      }
    };
  }

  private getHeadingSize(tagName: string): number {
    const sizes: { [key: string]: number } = {
      'h1': 24,
      'h2': 20,
      'h3': 18,
      'h4': 16,
      'h5': 14,
      'h6': 13
    };
    return sizes[tagName] || 12;
  }
}