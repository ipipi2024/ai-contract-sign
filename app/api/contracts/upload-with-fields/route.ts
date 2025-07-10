// app/api/contracts/upload-with-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import User from '@/models/User';
import { DocumentProcessor } from '@/lib/documentProcessor';

// Field interface matching your frontend
interface Field {
  id: string;
  type: string; // Using uppercase: "SIGNATURE", "TEXT", etc.
  recipientEmail: string;
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
  fieldMeta?: {
    type: string;
    text?: string;
    required?: boolean;
    readOnly?: boolean;
    characterLimit?: number;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    value?: string | number;
    minValue?: number;
    maxValue?: number;
    numberFormat?: string;
    values?: Array<{ id: string; value: string; checked?: boolean }>;
    validationRule?: string;
    validationLength?: number;
    defaultValue?: string;
  };
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: 'SIGNER' | 'VIEWER' | 'APPROVER';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user can create contract
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.canCreateContract()) {
      return NextResponse.json({ 
        error: 'Contract limit reached for your plan' 
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const documentFile = formData.get('document') as File;
    const recipientsData = formData.get('recipients') as string;
    const fieldsData = formData.get('fields') as string;

    if (!documentFile || !recipientsData || !fieldsData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse recipients and fields
    const recipients: Recipient[] = JSON.parse(recipientsData);
    const fields: Field[] = JSON.parse(fieldsData);

    // Validate recipients
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    // Validate fields
    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Process the document to extract structure
    const documentProcessor = DocumentProcessor.getInstance();
    const processedDocument = await documentProcessor.processDocument(documentFile);

    // Create a contract structure that preserves the original document
    // and embeds the field definitions
    const contractContent = {
      originalFormat: processedDocument.originalFormat,
      documentName: documentFile.name,
      pageSize: processedDocument.pageSize,
      pages: processedDocument.pages,
      
      // Store the original document elements for rendering
      elements: processedDocument.elements,
      
      // Store the user-defined fields separately
      userFields: fields.map(field => ({
        ...field,
        fieldType: field.type.toLowerCase(), // Convert to lowercase for consistency
        recipientEmail: field.recipientEmail,
        page: field.pageNumber,
        position: {
          x: field.pageX,
          y: field.pageY,
          width: field.pageWidth,
          height: field.pageHeight
        },
        metadata: field.fieldMeta || {}
      })),
      
      // Field values will be stored here when filled
      fieldValues: {},
      
      // Document metadata
      metadata: {
        ...processedDocument.metadata,
        uploadedAt: new Date(),
        uploadedBy: session.user.email
      }
    };

    // Convert recipients to parties format for consistency with existing system
    const parties = recipients.map(recipient => ({
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
      signed: false,
      signatureId: null,
      signedAt: null
    }));

    // Create the contract
    const contract = await Contract.create({
      userId: session.user.id,
      title: documentFile.name.replace(/\.[^/.]+$/, '') || 'Uploaded Document',
      type: 'custom',
      requirements: `Uploaded document with ${fields.length} fields for ${recipients.length} recipients`,
      content: JSON.stringify(contractContent),
      parties: parties,
      status: 'draft',
      
      // Additional metadata for uploaded documents
      metadata: {
        source: 'upload',
        originalFileName: documentFile.name,
        fieldsCount: fields.length,
        recipientsCount: recipients.length,
        documentType: 'field-based'
      }
    });

    // Increment user's contract count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { contractsCreated: 1 }
    });

    return NextResponse.json({
      success: true,
      contract: {
        _id: contract._id.toString(),
        title: contract.title,
        status: contract.status,
        createdAt: contract.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing document with fields:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}