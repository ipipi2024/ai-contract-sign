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
- For signature blocks, use exactly 20 underscores (_) to indicate where signatures should go
- DO NOT include any labels like "Name:", "Signature:", or "Date:" in the text
- For the final signature block, use a standard closing sentence which fits the contract scenario, like "IN WITNESS WHEREOF", followed by two underscore sequences separated by newlines
- Each underscore sequence should be exactly 20 underscores
- The signature blocks should be the last block in the contract
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- Make sure the contract is EXTREMELY comprehensive and professional. It should be so comprehensive that it is impossible to miss any information.
- Make sure the list of unknowns is as short as possible, consisting of ONLY the most essential, mandatory pieces of information that the contract cannot be created without.
- Use newlines (\\n) for better formatting
- NEVER use "PartyA" or "PartyB" anywhere in the contract text


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
`;

  const userMessage = `Please draft a contract based on this request. Pay special attention to any specific names, companies, contexts, or details mentioned and incorporate them directly into the contract text:

"${userPrompt}"

Remember: Use any specific names or details provided instead of generic placeholders.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ],
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

You are a contract‐writing assistant. You must return the ENTIRE contract in the EXACT JSON schema format with "blocks" and "unknowns" properties.

Here is the current contract:
${JSON.stringify(fullContractJson, null, 2)}

Please regenerate ONLY block ${blockIndex} according to the user's instructions below and return the entire contract in the same JSON schema format:

{
  "blocks": [
    { "text": "...", "signatures": [...] },
    ...
  ],
  "unknowns": [...]
}

CRITICAL REQUIREMENTS:
- Return the COMPLETE contract with ALL blocks (only modify block ${blockIndex})

SIGNATURE/NAME/DATE FIELD REQUIREMENTS - FOLLOW EXACTLY:
- ONLY use underscores for signature/name/date fields - NEVER for other blanks
- Signature/name/date fields must be exactly 20 underscores: ____________________
- For amounts or other fill-in fields, use brackets like [AMOUNT], [PROPERTY ADDRESS] or write descriptive text
- For EVERY sequence of 20 underscores in the text, you MUST create exactly ONE corresponding signature/name/date object
- The number of signature/name/date objects in block ${blockIndex} MUST equal the number of 20-underscore sequences in that block's text
- Each signature/name/date object must have: party ("PartyA" or "PartyB"), img_url (preserve existing or empty string ""), index (0, 1, 2... in order of appearance)
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- PRESERVE EXISTING img_url VALUES - do not change img_url fields that already contain signature data

CRITICAL PARTY NAMING RULES:
- NEVER use "PartyA" or "PartyB" anywhere in the contract text, only in signature/name/date objects
- Within the contract text, use role-based titles that match the contract type: "Contractor", "Client", "Property Owner", "Service Provider", "Roofer", "Tenant", "Landlord", etc.
- If names are provided in the user prompt, use those actual names instead of generic titles
- The contract text should refer to parties by their role or name, not generic labels like "PartyA" or "PartyB"

UNDERSCORE USAGE RULES:
- 20 underscores (____________________) = SIGNATURE/NAME/DATE FIELD ONLY (date will be automatically appended to signature)
- For amounts: use "[AMOUNT]" or write specific amounts
- For addresses: use "[PROPERTY ADDRESS]" or write actual address
- DO NOT include separate date fields near signatures - dates are automatically added to signature images
- NEVER use 20 underscores for anything except signature/name/date collection

VALIDATION CHECK:
- Count the 20-underscore sequences in block ${blockIndex}'s text
- Ensure the signature/name/date objects array has exactly that many objects
- NO MISMATCHES ALLOWED

- You can use newlines (\\n) within contract text for better formatting and readability
- Update the list of unknowns. If you can cross out an unknown, given information you were provided in the user instructions, do so.

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately

Return ONLY the JSON with "blocks" and "unknowns" properties (no extra commentary or markdown formatting).

User instructions: "${userInstructions}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
  });
  
  const text = completion.choices[0].message.content;
  console.log('Raw OpenAI response for block regeneration:', text);
  
  const cleanedText = cleanJsonResponse(text || '');
  console.log('Cleaned text for parsing:', cleanedText);
  
  try {
    const result = JSON.parse(cleanedText);
    console.log('Parsed result:', {
      hasBlocks: !!result?.blocks,
      blocksCount: result?.blocks?.length,
      hasUnknowns: !!result?.unknowns
    });
    return result;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError);
    console.error('Text that failed to parse:', cleanedText);
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
  }
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
- Generate comprehensive blocks to create a complete, professional contract
- Each block should represent a major contract section (e.g., parties/scope, terms, payment, termination, signatures)

SIGNATURE/NAME/DATE FIELD REQUIREMENTS - FOLLOW EXACTLY:
- ONLY use underscores for signature/name/date fields - NEVER for other blanks
- Signature/name/date fields must be exactly 20 underscores: ____________________
- For amounts or other fill-in fields, use brackets like [AMOUNT], [PROPERTY ADDRESS] or write descriptive text
- For EVERY sequence of 20 underscores in the text, you MUST create exactly ONE corresponding signature/name/date object
- The number of signature/name/date objects in each block MUST equal the number of 20-underscore sequences in that block's text
- Each signature/name/date object must have: party ("PartyA" or "PartyB"), img_url (preserve existing or empty string ""), index (0, 1, 2... in order of appearance)
- The "index" field represents the order the signature/name/date appears in the text (first underscore sequence = index 0, second = index 1, etc.)
- PRESERVE EXISTING img_url VALUES - do not change img_url fields that already contain signature data

CRITICAL PARTY NAMING RULES:
- NEVER use "PartyA" or "PartyB" anywhere in the contract text, only in signature/name/date objects
- Within the contract text, use role-based titles that match the contract type: "Contractor", "Client", "Property Owner", "Service Provider", "Roofer", "Tenant", "Landlord", etc.
- If names are provided in the user prompt, use those actual names instead of generic titles
- The contract text should refer to parties by their role or name, not generic labels like "PartyA" or "PartyB"


UNDERSCORE USAGE RULES:
- 20 underscores (____________________) = SIGNATURE/NAME/DATE FIELD ONLY (date will be automatically appended to signature)
- For amounts: use "[AMOUNT]" or write specific amounts
- For addresses: use "[PROPERTY ADDRESS]" or write actual address
- DO NOT include separate date fields near signatures - dates are automatically added to signature images
- NEVER use 20 underscores for anything except signature/name/date collection

VALIDATION CHECK:
- Count the 20-underscore sequences in each block's text
- Ensure the signature/name/date objects array has exactly that many objects
- NO MISMATCHES ALLOWED

- You can use newlines (\\n) within contract text for better formatting and readability
- Update the list of unknowns based on the new contract requirements

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names, use those names directly in the contract text
- If the user mentions specific context, incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships, reference that context appropriately

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
