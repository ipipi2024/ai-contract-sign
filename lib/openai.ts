import OpenAI from 'openai';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your actual OpenAI API key
});

// TypeScript interfaces for contract structure
interface Signature {
  party: string;
  img_url: string;
  index: number; // index of the signature in the block
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

try {

} catch(error) {

}

export async function generateContract(requirements: {
  type: string;
  parties: string[];
  terms: string;
  additionalRequirements?: string;
}): Promise<string> {
  const prompt = `Generate a professional ${requirements.type} contract with the following requirements:
Parties involved: ${requirements.parties.join(', ')}
Key terms: ${requirements.terms}
Additional requirements: ${requirements.additionalRequirements || 'None'}

Please create a comprehensive, legally sound contract that includes:
1. Clear identification of all parties
2. Detailed terms and conditions
3. Rights and obligations of each party
4. Duration/term of the contract
5. Termination clauses
6. Dispute resolution
7. Governing law
8. Signature blocks for all parties

Format the contract professionally with clear sections and subsections.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // You can also use 'gpt-4', 'gpt-3.5-turbo', etc.
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return content;
    } else {
      throw new Error('No content received from OpenAI API');
    }
    
  } catch (error) {
    console.error('Error generating contract:', error);
    throw new Error('Failed to generate contract');
  }
}

// Helper function to clean JSON responses that might be wrapped in markdown
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json at the start
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  
  // Remove ``` at the end
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // Also handle cases where it just starts with ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  
  return cleaned.trim();
}

export async function generateContractJson(userPrompt: string): Promise<ContractJson> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });

  const systemPrompt = `
Today is ${currentDate}.
You are a contract generation assistant. You MUST return a JSON object with the following structure:
{
  "blocks": [
    {
      "text": "string",
      "signatures": [
        {
          "party": "string", // Which of the parties is signing this signature field. Two possible values: "PartyA" or "PartyB". PartyA is the party that generated the contract and is requesting the signature. PartyB is the party that is signing the contract.
          "img_url": "",     // The URL of the party's signature image. This will be used to display the signature image in the UI and will be entered client-side. Do NOT include any text in this field as it will be updated client-side (should be empty for now).
          "index": number    // The index of the signature in the block.
        }
      ]
    }
  ],
  "unknowns": ["string"],
  "assessment": "string"
}

CRITICAL REQUIREMENTS:
- Each block's text should be a complete section of the contract, include 5 - 10 blocks
- Do NOT create information that is not provided in the user prompt. Ask the user for the information by including it in the unknowns list.
- DO NOT include any labels like "Name:", "Signature:", or "Date:" in the text
- The signature block should be the last block in the contract
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- Make sure the contract is EXTREMELY comprehensive and professional. It should be so comprehensive that it is impossible to miss any information.
- Make sure the list of unknowns is as short as possible, consisting of ONLY the most essential, mandatory pieces of information that the contract cannot be created without.
- Use newlines (\\n) for better formatting
- NEVER use "PartyA" or "PartyB" anywhere in the contract text, only in signature objects
- PRESERVE EXISTING img_url VALUES - do not change img_url fields that already contain signature data
- Do NOT use underscores for anything except signature/name/date collection
- Leverage the given date where relevant

CONTRACT ASSESSMENT REQUIREMENTS:
- Provide a 25-word assessment of the contract's validity, quality, and legal soundness
- Be honest and direct about any potential issues or missing elements

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately

ALWAYS include a final signature block, use a standard closing sentence which fits the contract scenario, followed by two underscore sequences separated by newlines
EXAMPLE SIGNATURE BLOCK FORMAT:
IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first above written.

____________________

____________________

Return ONLY the JSON (no extra commentary or markdown formatting).

Make absolutely sure to include a final signature block with the described format, take special care to include the 2 sequences of 20 underscores separated by newlines.
DO NOT forget to include the 2 sequences of 20 underscores separated by newlines.`;

  const userMessage = `Please draft a contract based on this request. Pay special attention to any specific names, companies, contexts, or details mentioned and incorporate them directly into the contract text:

"${userPrompt}"

Remember: Use any specific names or details provided instead of generic placeholders.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
  });

  // Clean the response and parse as JSON
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function regenerateBlockJson(
  fullContractJson: ContractJson,
  blockIndex: number,
  userInstructions: string
): Promise<ContractJson> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });
  
  const systemPrompt = `
Today is ${currentDate}.

You are a contract generation assistant. You MUST return a JSON object with the following structure:
{
  "blocks": [
    {
      "text": "string",
      "signatures": [
        {
          "party": "string", // Which of the parties is signing this signature field. Two possible values: "PartyA" or "PartyB". PartyA is the party that generated the contract and is requesting the signature. PartyB is the party that is signing the contract.
          "img_url": "",     // The URL of the party's signature image. This will be used to display the signature image in the UI and will be entered client-side. Do NOT include any text in this field as it will be updated client-side (should be empty for now).
          "index": number    // The index of the signature in the block.
        }
      ]
    }
  ],
  "unknowns": ["string"],
  "assessment": "string"
}

CRITICAL REQUIREMENTS:
- Each block's text should be a complete section of the contract, include 5 - 10 blocks
- Do NOT create information that is not provided in the user prompt. Ask the user for the information by including it in the unknowns list.
- For signature blocks, use exactly 20 underscores (_) to indicate where signatures should go
- DO NOT include any labels like "Name:", "Signature:", or "Date:" in the text
- For the final signature block, use a standard closing sentence which fits the contract scenario, like "IN WITNESS WHEREOF", followed by two underscore sequences separated by newlines
- Each underscore sequence should be exactly 20 underscores
- The signature blocks should be the last block in the contract
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- Make sure the contract is EXTREMELY comprehensive and professional. It should be so comprehensive that it is impossible to miss any information.
- Make sure the list of unknowns is as short as possible, consisting of ONLY the most essential, mandatory pieces of information that the contract cannot be created without.
- Use newlines (\\n) for better formatting
- NEVER use "PartyA" or "PartyB" anywhere in the contract text, only in signature objects
- PRESERVE EXISTING img_url VALUES - do not change img_url fields that already contain signature data

CONTRACT ASSESSMENT REQUIREMENTS:
- Provide a 25-word assessment of the contract's validity, quality, and legal soundness
- Be honest and direct about any potential issues or missing elements
- Highlight any areas that might need legal review
- Mention if the contract is missing standard clauses for its type
- Note if any terms are unclear or potentially problematic

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately

EXAMPLE SIGNATURE BLOCK FORMAT:
IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first above written.

____________________

____________________

Return ONLY the JSON (no extra commentary or markdown formatting).

User instructions: "${userInstructions}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
  });
  
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function regenerateContract(
  contractJson: ContractJson,
  userInstructions: string
): Promise<ContractJson> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });
  
  const systemPrompt = `
Today is ${currentDate}.

You are a contract‐writing assistant. Here is the existing contract:
${JSON.stringify(contractJson, null, 2)}

Please regenerate the ENTIRE contract according to the user's instructions below and return the complete contract in the same JSON schema format.


CRITICAL REQUIREMENTS:
- Each block's text should be a complete section of the contract, include 5 - 10 blocks
- Do NOT create information that is not provided in the user prompt. Ask the user for the information by including it in the unknowns list.
- For signature blocks, use exactly 20 underscores (_) to indicate where signatures should go
- DO NOT include any labels like "Name:", "Signature:", or "Date:" in the text
- For the final signature block, use a standard closing sentence which fits the contract scenario, like "IN WITNESS WHEREOF", followed by two underscore sequences separated by newlines
- Each underscore sequence should be exactly 20 underscores
- The signature blocks should be the last block in the contract
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- Make sure the contract is EXTREMELY comprehensive and professional. It should be so comprehensive that it is impossible to miss any information.
- Make sure the list of unknowns is as short as possible, consisting of ONLY the most essential, mandatory pieces of information that the contract cannot be created without.
- Use newlines (\\n) for better formatting
- NEVER use "PartyA" or "PartyB" anywhere in the contract text, only in signature objects
- PRESERVE EXISTING img_url VALUES - do not change img_url fields that already contain signature data

CONTRACT ASSESSMENT REQUIREMENTS:
- Provide a 25-word assessment of the contract's validity, quality, and legal soundness
- Be honest and direct about any potential issues or missing elements
- Highlight any areas that might need legal review
- Mention if the contract is missing standard clauses for its type
- Note if any terms are unclear or potentially problematic

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately

EXAMPLE SIGNATURE BLOCK FORMAT:
IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first above written.

____________________

____________________

Return ONLY the JSON (no extra commentary or markdown formatting).

User instructions: "${userInstructions}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
  });
  
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function generateSummaryText(contractJson: ContractJson): Promise<string> {
  const systemPrompt = `
You are a contract summarization assistant. You MUST return a JSON array of exactly 4 strings.

CRITICAL REQUIREMENTS:
- Return ONLY a JSON array with exactly 4 strings
- Each string should be a concise summary point about the contract
- Maximum 50 words per string
- NO markdown, NO special formatting
- Just plain text strings in a JSON array

EXAMPLE FORMAT (copy this structure exactly):
[
  "This contract establishes a service agreement between two parties",
  "The service provider will deliver specified work within 30 days",
  "Payment terms include a $5000 fee due upon completion", 
  "Either party may terminate with 7 days written notice"
]

Return ONLY the JSON array, no other text.
`;

  const userMessage = `Summarize this contract as a JSON array of exactly 4 strings:\n\n${JSON.stringify(contractJson, null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1, // Very low temperature for consistent formatting
  });

  const result = completion.choices[0].message.content?.trim() || '';
  console.log("Raw AI summary response:", JSON.stringify(result));
  
  try {
    // Parse as JSON array
    const cleanedResult = cleanJsonResponse(result);
    const summaryArray = JSON.parse(cleanedResult);
    
    if (Array.isArray(summaryArray) && summaryArray.length >= 4) {
      // Take first 4 items and ensure they're strings
      const finalSummary = summaryArray.slice(0, 4).map(item => String(item).trim());
      console.log("Parsed summary array:", finalSummary);
      return finalSummary.join('\n'); // Join with newlines for backward compatibility
    } else {
      throw new Error("Invalid array format or insufficient items");
    }
  } catch (error) {
    console.error("Failed to parse summary as JSON:", error);
    
    // Fallback: try to split the text manually
    const fallbackSummary = [
      "This contract establishes an agreement between the specified parties",
      "The terms and conditions are outlined in the contract blocks",
      "Payment and performance obligations are detailed in the agreement",
      "Termination and governing law provisions apply as specified"
    ];
    
    return fallbackSummary.join('\n');
  }
}
