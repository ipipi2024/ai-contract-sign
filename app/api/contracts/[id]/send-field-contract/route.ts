// app/api/contracts/[id]/send-field-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { sendFieldContractEmail } from '@/lib/field-contract-mailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

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

    // Check if this is a field-based document
    if (!contractContent.userFields) {
      return NextResponse.json(
        { error: 'This is not a field-based contract' },
        { status: 400 }
      );
    }

    // Update contract status to 'sent'
    await db.collection('contracts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
          recipientEmail: recipientEmail,
          updatedAt: new Date()
        }
      }
    );

    // Send email to recipient
    await sendFieldContractEmail(id, contractContent, recipientEmail);

    return NextResponse.json({
      success: true,
      message: 'Contract sent successfully'
    });

  } catch (error) {
    console.error('Error sending field contract:', error);
    return NextResponse.json(
      { error: 'Failed to send contract' },
      { status: 500 }
    );
  }
}