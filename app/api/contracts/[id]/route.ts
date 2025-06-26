//app/api/contract/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET /api/contracts/[id] - Fetch a single contract by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using
    const { id } = await params;
    console.log('Received contract ID:', id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Use native MongoDB driver through Mongoose connection
    const db = mongoose.connection.db;
    
    // Debug: Check if db exists
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Find the contract by ID
    const contract = await db.collection('contracts').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract status or other fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using
    const { id } = await params;
    const body = await request.json();

    console.log('Update request body:', body);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // First, get the current contract to check if it can be edited
    const currentContract = await db.collection('contracts').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!currentContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract is completed (cannot edit completed contracts)
    // But allow updating parties field even for completed contracts
    if (currentContract.status === 'completed' && !body.parties) {
      return NextResponse.json(
        { error: 'Cannot edit completed contracts' },
        { status: 400 }
      );
    }

    // Check if any party has signed (optional: prevent editing if anyone has signed)
    // But allow if we're updating the parties field itself
    const hasSignatures = currentContract.parties?.some((party: any) => party.signed);
    if (hasSignatures && !body.parties && !body.status) {
      return NextResponse.json(
        { error: 'Cannot edit contract with existing signatures' },
        { status: 400 }
      );
    }

    // Prepare update data - now including content and parties fields
    const allowedFields = ['status', 'title', 'content', 'requirements', 'parties'];
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only include allowed fields in update
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    console.log('Update data:', updateData);

    // Update the contract
    const result = await db.collection('contracts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes were made to the contract' },
        { status: 400 }
      );
    }

    // Fetch and return updated contract
    const updatedContract = await db.collection('contracts').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      contract: updatedContract
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete a contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using
    const { id } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Delete the contract
    const result = await db.collection('contracts').deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Contract deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}