// app/api/upload/parse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// For now, using simple parsing without external dependencies
async function parseDocumentServer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return buffer.toString('utf-8');
       
      case 'application/pdf':
        // For now, return a placeholder. Add pdf-parse later with proper configuration
        return `[PDF Content from ${fileName}]\n[Note: PDF parsing will be added with proper configuration]`;
       
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        // For now, return a placeholder. Add mammoth later
        return `[DOCX Content from ${fileName}]\n[Note: DOCX parsing will be added]`;
       
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        // For now, return a placeholder. Add tesseract.js later
        return `[Image Content from ${fileName}]\n[Note: OCR capabilities will be added]`;
       
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse the document
    const extractedText = await parseDocumentServer(buffer, file.type, file.name);
    const cleanedText = cleanExtractedText(extractedText);

    return NextResponse.json({
      success: true,
      text: cleanedText,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

// Configure max file size for Next.js
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};