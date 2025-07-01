// app/api/contracts/detect-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const systemPrompt = `You are a document field detection AI. Analyze the following contract text and identify all input fields that need to be filled out.

For each field found, return a JSON object with:
- type: "text" | "signature" | "date" | "checkbox" | "initial"
- name: A descriptive name for the field
- pattern: The exact text pattern that indicates this field
- required: boolean indicating if the field seems required
- context: The surrounding text (up to 50 characters before and after)

Common patterns to look for:
- Underscores: ____________
- Brackets: [Name], [Date], [Signature]
- Parentheses with spaces: ( )
- Explicit labels: "Name:", "Date:", "Signature:", etc.

Return ONLY a JSON array of detected fields.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0]?.message?.content;
    const fields = result ? JSON.parse(result) : { fields: [] };

    return NextResponse.json({ fields: fields.fields || fields });

  } catch (error) {
    console.error('Error detecting fields:', error);
    return NextResponse.json(
      { error: 'Failed to detect fields' },
      { status: 500 }
    );
  }
}