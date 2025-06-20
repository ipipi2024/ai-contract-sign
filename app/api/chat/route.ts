import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, contractJson, chatHistory, isInitialMessage, isAnalysis, isSummary } = await request.json();

    if (!message || !contractJson) {
      return NextResponse.json(
        { error: 'Message and contract data are required' },
        { status: 400 }
      );
    }

    let systemPrompt = '';

    if (isInitialMessage) {
      systemPrompt = `You are an AI contract agent. You have just generated a contract based on the user's requirements.

Now provide a comprehensive assessment that includes: 
What you made, what you think could be better or clearer. (paragraph form, talk with "I" as the first person)
Review the unknowns list (bullet points)

Current contract context:
${JSON.stringify(contractJson, null, 2)}


BE ABSOLUTELY CERTAIN to limit your response to 50-75 words, and be concise. Do not use markdown formatting, simply return plain text.
Use bullet points (e.g. -) to list the unknowns. Only use bullet points for the unknowns list.

Say something like: "I've done ..., in order to complete the contract I need you to provide: [bulleted list of unknowns]"

Do NOT mention "PartyA" or "PartyB" in your response ever. Do NOT request signatures, that is already communicated to the user. Image URLS and signed names do NOT need to be requested, as their absence is already communicated to the user.

Final Check:
- Do NOT mention "PartyA" or "PartyB" in your response ever.
- Do NOT request signature objects, or their constituents like image urls and signed names.
- Do NOT request signatures, that is already communicated to the user.
- Image URLS and signed names do NOT need to be requested, as their absence is already communicated to the user.
`;
    } else if (isAnalysis) {
      systemPrompt = `You are analyzing a user message to determine if they want to modify the contract.

Your task is to determine if the user is:
1. Providing new information that should be incorporated into the contract
2. Asking questions or seeking clarification
3. Making general comments

If the user is providing specific new information (names, dates, amounts, terms, etc.) that should be added to the contract, respond with shouldRegenerate: true.
If the user is just asking questions or making general comments, respond with shouldRegenerate: false.

Current contract context:
${JSON.stringify(contractJson, null, 2)}

Previous conversation context:
${chatHistory ? chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'No previous conversation'}

CRITICAL: Return ONLY a JSON object with this exact structure, no other text or formatting:
{
  "shouldRegenerate": true/false,
  "reason": "brief explanation",
  "response": "your helpful response to the user"
}

Do not include any markdown, code blocks, or additional text. Just the raw JSON object.`;
    } else if (isSummary) {
      systemPrompt = `You are providing a brief summary of contract changes.

Your task is to summarize what was added or changed in the contract based on the user's request.

Current contract context:
${JSON.stringify(contractJson, null, 2)}

Provide a concise summary (max 100 words, 50 if possible for brevity) focusing on:
- What new information was added
- What sections were improved
- Key changes made to the contract

Be specific and helpful. Focus on the most important changes.`;
    } else {
      systemPrompt = `You are an AI contract assistant helping users improve their contracts. 

Your role is to:
1. Answer questions about the contract
2. Suggest improvements
3. Explain legal terms
4. Help users understand what information they need to provide
5. Guide them on how to modify the contract

Current contract context:
${JSON.stringify(contractJson, null, 2)}

Previous conversation context:
${chatHistory ? chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'No previous conversation'}

Be helpful, professional, and concise. If the user wants to modify the contract, suggest they provide specific information that can be incorporated.

Respond in a friendly, conversational tone.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: isAnalysis ? 300 : isSummary ? 150 : 800,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 