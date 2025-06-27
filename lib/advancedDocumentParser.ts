// lib/advancedDocumentParser.ts
// This file should be used server-side for better performance and security

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

export async function parseDocumentServer(file: Buffer, mimeType: string, fileName: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return file.toString('utf-8');
        
      case 'application/pdf':
        return await parsePDFServer(file);
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseDOCXServer(file);
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return await parseImageServer(file, mimeType);
        
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}

async function parsePDFServer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document');
  }
}

async function parseDOCXServer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX document');
  }
}

async function parseImageServer(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    // Convert buffer to base64 data URL
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(dataUrl);
    
    // Terminate worker
    await worker.terminate();
    
    return text || '[No text found in image]';
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Utility function to clean and format extracted text
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}