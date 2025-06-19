//app/api/contracts/[id]/finalize
import { NextRequest, NextResponse } from 'next/server';
import { sendFinalizedContractEmail } from '@/lib/mailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { contractJson, recipientEmail } = await request.json();
    const { id } = await params;

    if (!contractJson || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: contractJson and recipientEmail' },
        { status: 400 }
      );
    }

    // Send the finalized contract email with PDF attachment
    await sendFinalizedContractEmail(id, contractJson, recipientEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending finalized contract email:', error);
    return NextResponse.json(
      { error: 'Failed to send finalized contract email' },
      { status: 500 }
    );
  }
} 