// app/api/contracts/[id]/generate-filled-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { generateFieldBasedPDF } from '@/lib/pdf-field-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate contract ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get the contract
    const contract = await db.collection('contracts').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Parse contract content
    let contractContent;
    if (typeof contract.content === 'string') {
      contractContent = JSON.parse(contract.content);
    } else {
      contractContent = contract.content;
    }

    // Check if this is an uploaded document with fields
    if (!contractContent.userFields) {
      return NextResponse.json(
        { error: 'This contract does not support field-based PDF generation' },
        { status: 400 }
      );
    }

    // Generate PDF with filled fields
    const pdfBuffer = await generateFieldBasedPDF(contractContent, id);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${id}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating filled PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}