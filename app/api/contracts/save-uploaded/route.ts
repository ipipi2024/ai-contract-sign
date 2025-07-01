// app/api/contracts/save-uploaded/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document, fieldValues } = await request.json();

    if (!document) {
      return NextResponse.json({ error: 'Document is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Convert the processed document into a format suitable for storage
    const contractContent = {
      originalFormat: document.originalFormat,
      elements: document.elements,
      fieldValues: fieldValues,
      pages: document.pages,
      metadata: document.metadata
    };

    // Extract parties from detected fields
    const parties = fieldValues
      .filter((field: any) => field.type === 'text' && field.value)
      .map((field: any) => ({
        name: field.value,
        email: '', // Would need to detect email fields specifically
        role: 'Party',
        signed: false
      }));

    // Create the contract
    const contract = await Contract.create({
      userId: session.user.id,
      title: document.metadata?.title || 'Uploaded Contract',
      type: 'custom',
      requirements: 'Uploaded document with field detection',
      content: JSON.stringify(contractContent),
      parties: parties.length > 0 ? parties : [
        {
          name: session.user.name || 'User',
          email: session.user.email,
          role: 'Party A',
          signed: false
        }
      ],
      status: 'draft'
    });

    return NextResponse.json({ 
      contractId: contract._id,
      message: 'Contract saved successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving uploaded contract:', error);
    return NextResponse.json(
      { error: 'Failed to save contract' },
      { status: 500 }
    );
  }
}