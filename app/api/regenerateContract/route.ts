import { NextRequest, NextResponse } from 'next/server';
import { regenerateContract } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { contractJson, userPrompt } = await request.json();

    if (!contractJson || !userPrompt) {
      return NextResponse.json(
        { error: 'Contract and user prompt are required' },
        { status: 400 }
      );
    }

    const regeneratedContract = await regenerateContract(contractJson, userPrompt);
    
    return NextResponse.json(regeneratedContract);
  } catch (error: any) {
    console.error('Error regenerating contract:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          error: 'OpenAI rate limit reached. Please wait a moment and try again.',
          retryAfter: error.headers?.['retry-after'] || '60'
        },
        { status: 429 }
      );
    }
    
    // Handle other OpenAI API errors
    if (error.code) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to regenerate contract' },
      { status: 500 }
    );
  }
} 