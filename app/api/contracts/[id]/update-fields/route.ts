// app/api/contracts/[id]/update-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

interface FieldValue {
  fieldId: string;
  value: string | boolean | number;
  type: string;
  recipientEmail?: string;
  timestamp?: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fieldValues, recipientEmail } = await request.json();

    if (!fieldValues || !Array.isArray(fieldValues)) {
      return NextResponse.json(
        { error: 'Field values must be an array' },
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

    // Check if this is an uploaded document with fields
    if (!contractContent.userFields) {
      return NextResponse.json(
        { error: 'This contract does not support field updates' },
        { status: 400 }
      );
    }

    // Validate recipient email if provided
    if (recipientEmail) {
      const validRecipient = contract.parties?.some(
        (party: any) => party.email === recipientEmail
      );
      
      if (!validRecipient) {
        return NextResponse.json(
          { error: 'Invalid recipient email' },
          { status: 403 }
        );
      }
    }

    // Initialize fieldValues if not exists
    if (!contractContent.fieldValues) {
      contractContent.fieldValues = {};
    }

    // Update field values
    fieldValues.forEach((fieldValue: FieldValue) => {
      // Validate that the field exists in userFields
      const fieldExists = contractContent.userFields.some(
        (field: any) => field.id === fieldValue.fieldId
      );

      if (fieldExists) {
        contractContent.fieldValues[fieldValue.fieldId] = {
          value: fieldValue.value,
          type: fieldValue.type,
          updatedAt: new Date(),
          updatedBy: recipientEmail || 'unknown'
        };
      }
    });

    // Check if all required fields are filled
    const requiredFields = contractContent.userFields.filter(
      (field: any) => field.metadata?.required
    );
    
    const allRequiredFilled = requiredFields.every(
      (field: any) => contractContent.fieldValues[field.id]?.value
    );

    // Update contract status if all required fields are filled
    let newStatus = contract.status;
    if (allRequiredFilled && contract.status === 'draft') {
      newStatus = 'pending';
    }

    // Update the contract
    await db.collection('contracts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          content: JSON.stringify(contractContent),
          status: newStatus,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Field values updated successfully',
      allRequiredFilled
    });

  } catch (error) {
    console.error('Error updating field values:', error);
    return NextResponse.json(
      { error: 'Failed to update field values' },
      { status: 500 }
    );
  }
}