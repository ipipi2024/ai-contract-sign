// app/api/contracts/upload-with-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { PDFDocument } from 'pdf-lib';
import { insertFieldInPDF } from '@/lib/pdf/insert-field-in-pdf';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const documentFile = formData.get('document') as File;
    const fieldsData = formData.get('fields') as string;

    if (!documentFile || !fieldsData) {
      return NextResponse.json(
        { error: 'Missing document or fields' },
        { status: 400 }
      );
    }

    // Parse fields
    const fields = JSON.parse(fieldsData);

    // Read the PDF file
    const arrayBuffer = await documentFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Process each field and add it to the PDF
    for (const field of fields) {
      // Convert field coordinates from pixels to PDF points
      const pages = pdfDoc.getPages();
      const page = pages[field.page - 1];
      if (!page) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert percentages (since the viewer uses relative positioning)
      const pdfField = {
        ...field,
        positionX: (field.x / 100) * pageWidth,
        positionY: (field.y / 100) * pageHeight,
        width: (field.width / 100) * pageWidth,
        height: (field.height / 100) * pageHeight,
      };

      // Insert field into PDF based on type
      await insertFieldInPDF(pdfDoc, pdfField);
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Create a contract in the database
    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        title: documentFile.name.replace('.pdf', '') || 'Uploaded Contract',
        description: 'Contract created from uploaded document',
        status: 'draft',
        documentData: Buffer.from(modifiedPdfBytes).toString('base64'),
        fields: fields,
        metadata: {
          source: 'upload',
          originalFileName: documentFile.name,
          fieldsAdded: fields.length,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contract: {
        _id: contract.id,
        title: contract.title,
      },
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}