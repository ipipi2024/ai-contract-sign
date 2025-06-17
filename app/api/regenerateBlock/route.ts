import { NextRequest, NextResponse } from 'next/server';
import { regenerateBlockJson } from '@/lib/openai';

interface Signature {
  party: string;
  img_url: string;
  index: number;
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  assessment: string;
  title?: string;
  type?: string;
  parties?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractJson, blockIndex, userPrompt } = body;

    // Validate required fields
    if (!contractJson || typeof blockIndex !== 'number' || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: contractJson, blockIndex, and userPrompt are required' },
        { status: 400 }
      );
    }

    // Validate blockIndex
    if (blockIndex < 0 || blockIndex >= contractJson.blocks.length) {
      return NextResponse.json(
        { error: 'Invalid blockIndex' },
        { status: 400 }
      );
    }

    // Regenerate the specific block
    console.log('Calling regenerateBlockJson with:', {
      blockIndex,
      userPrompt,
      blocksCount: contractJson.blocks.length
    });
    
    const updatedContractJson = await regenerateBlockJson(
      contractJson,
      blockIndex,
      userPrompt
    );

    console.log('regenerateBlockJson returned:', {
      hasBlocks: !!updatedContractJson?.blocks,
      blocksCount: updatedContractJson?.blocks?.length,
      hasUnknowns: !!updatedContractJson?.unknowns
    });

    // Validate the result before sending
    if (!updatedContractJson || !updatedContractJson.blocks || !Array.isArray(updatedContractJson.blocks)) {
      console.error('Invalid result from regenerateBlockJson:', updatedContractJson);
      return NextResponse.json(
        { error: 'AI service returned invalid data structure' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedContractJson, { status: 200 });

  } catch (error) {
    console.error('Error regenerating block:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate block' },
      { status: 500 }
    );
  }
} 