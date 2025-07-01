// app/api/contracts/regenerate-section/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ProcessedDocument, DocumentElement } from '@/lib/documentProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { document, elementId, instructions } = await request.json();

    if (!document || !elementId || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the element to regenerate
    const elementIndex = document.elements.findIndex(
      (el: DocumentElement, index: number) => 
        `element-${el.position?.page}-${index}` === elementId
    );

    if (elementIndex === -1) {
      return NextResponse.json(
        { error: 'Element not found' },
        { status: 404 }
      );
    }

    const element = document.elements[elementIndex];
    const context = getContextForElement(document, elementIndex);

    // Use OpenAI to regenerate the content
    const systemPrompt = `You are a contract editing assistant. You need to regenerate a specific section of a contract while maintaining the same formal tone and structure as the original document.

Original section: "${element.content}"

Context (surrounding text):
${context}

The user wants to: ${instructions}

Important:
- Maintain the same formal legal language style
- Keep similar length and structure
- Preserve any references to other sections
- Do not change the meaning drastically unless explicitly requested
- If the section contains fields or placeholders, maintain them

Return ONLY the regenerated text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: instructions }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const regeneratedContent = completion.choices[0]?.message?.content?.trim();

    if (!regeneratedContent) {
      throw new Error('Failed to regenerate content');
    }

    // Update the document
    const updatedDocument: ProcessedDocument = {
      ...document,
      elements: document.elements.map((el: DocumentElement, index: number) => 
        index === elementIndex 
          ? { ...el, content: regeneratedContent }
          : el
      )
    };

    return NextResponse.json({ 
      updatedDocument,
      regeneratedContent 
    });

  } catch (error) {
    console.error('Error regenerating section:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate section' },
      { status: 500 }
    );
  }
}

function getContextForElement(document: ProcessedDocument, elementIndex: number): string {
  const elements = document.elements;
  const context: string[] = [];
  
  // Get 2 elements before and after for context
  const start = Math.max(0, elementIndex - 2);
  const end = Math.min(elements.length - 1, elementIndex + 2);
  
  for (let i = start; i <= end; i++) {
    if (i === elementIndex) {
      context.push('[CURRENT SECTION]');
    } else {
      context.push(elements[i].content.substring(0, 100) + '...');
    }
  }
  
  return context.join('\n\n');
}