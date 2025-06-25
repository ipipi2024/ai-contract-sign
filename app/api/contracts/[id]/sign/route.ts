// app/api/contracts/[id]/sign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import SigningToken from '@/models/SigningToken';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { contractJson, timestamp, token } = await request.json();
    const { id } = await params;

    await connectToDatabase();

    // If token is provided, validate it
    if (token) {
      const signingToken = await SigningToken.findOne({
        token,
        contractId: id,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!signingToken) {
        return NextResponse.json(
          { error: 'Invalid or expired signing token' },
          { status: 401 }
        );
      }

      // Mark token as used
      signingToken.used = true;
      signingToken.usedAt = new Date();
      signingToken.ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      await signingToken.save();
    }

    // Update contract
    await Contract.findByIdAndUpdate(id, {
      content: JSON.stringify(contractJson),
      status: 'pending',
      signedAt: timestamp,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { error: 'Failed to sign contract' },
      { status: 500 }
    );
  }
}