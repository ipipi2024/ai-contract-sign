// lib/documentParser.ts
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  
  try {
    switch (fileType) {
      case 'application/pdf':
        return await parsePDF(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await parseWord(file);
      
      case 'text/plain':
      case 'text/markdown':
        return await parseText(file);
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/jpg':
        // For images, we might want to use OCR in the future
        return `[Image file: ${file.name}]`;
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error('Failed to parse document');
  }
}

async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    // For now, return basic PDF info
    // In a real implementation, you'd extract text content
    return `PDF Document: ${file.name}\nPages: ${pages.length}\n\n[PDF content extraction would go here]`;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF');
  }
}

async function parseWord(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing Word document:', error);
    throw new Error('Failed to parse Word document');
  }
}

async function parseText(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw new Error('Failed to parse text file');
  }
}