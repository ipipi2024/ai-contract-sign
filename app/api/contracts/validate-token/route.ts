// app/api/contracts/validate-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SigningToken from '@/models/SigningToken';
import Contract from '@/models/Contract';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and validate token
    const signingToken = await SigningToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!signingToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get associated contract
    const contract = await Contract.findById(signingToken.contractId);
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      contractId: contract._id,
      party: signingToken.party,
      recipientEmail: signingToken.recipientEmail
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}