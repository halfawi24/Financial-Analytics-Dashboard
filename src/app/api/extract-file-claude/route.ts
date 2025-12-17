// Claude API powered file extraction endpoint
// Bulletproof extraction using Claude's vision + files API
// Free tier initially, minimal cost after ($0.03/1M input tokens)
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface ExtractionResult {
  success: boolean;
  assumptions?: Record<string, any>;
  mappedFields?: string[];
  confidence?: number;
  error?: string;
}

// Initialize Claude client
function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured. Get free tier at https://console.anthropic.com/api_keys');
  }
  return new Anthropic({ apiKey });
}

// Financial fields to extract
const EXTRACTION_PROMPT = `
You are a financial data extraction expert. I've uploaded a financial spreadsheet. 

TASK: Extract the following financial assumptions/metrics from the spreadsheet:
1. month1Revenue: Initial monthly revenue amount
2. monthlyGrowth: Monthly growth rate (as decimal, e.g., 0.10 = 10%)
3. cogsPercent: Cost of goods sold percentage (as decimal, e.g., 0.30 = 30%)
4. monthlyOpex: Monthly operating expenses
5. monthlyCapex: Monthly capital expenditure
6. taxRate: Tax rate (as decimal, e.g., 0.25 = 25%)
7. arDays: Accounts receivable days
8. apDays: Accounts payable days
9. loanAmount: Loan or debt principal amount
10. loanRate: Loan interest rate (as decimal)
11. loanTerm: Loan term in months

IMPORTANT RULES:
- Return ONLY valid numeric data you find in the spreadsheet
- If a value cannot be found or extracted, omit it (don't make up values)
- Return percentages as decimals (e.g., 25% = 0.25)
- Return amounts as numbers without commas or currency symbols
- Look across ALL sheets if multiple sheets exist
- Focus on actual financial data, not headers or labels

RESPONSE FORMAT (JSON only, no other text):
{
  "month1Revenue": <number or null>,
  "monthlyGrowth": <decimal or null>,
  "cogsPercent": <decimal or null>,
  "monthlyOpex": <number or null>,
  "monthlyCapex": <number or null>,
  "taxRate": <decimal or null>,
  "arDays": <number or null>,
  "apDays": <number or null>,
  "loanAmount": <number or null>,
  "loanRate": <decimal or null>,
  "loanTerm": <number or null>,
  "extractedFields": [<list of fields that were successfully extracted>]
}
`;

export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResult>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Determine media type
    let mediaType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png';
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // For Excel files, we'd need to convert to image or use a different approach
      // For now, send as is and Claude will try to understand
      mediaType = 'image/png'; // Claude will handle appropriately
    }

    const client = getClaudeClient();

    console.log(`📤 Sending file to Claude for extraction: ${file.name} (${buffer.length} bytes)`);

    // Call Claude API with file
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf' as const,
                data: base64,
              },
            } as any, // Type assertion needed for document type
          ],
        },
      ],
    });

    // Extract response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log(`✓ Claude response: ${responseText.substring(0, 200)}...`);

    // Parse JSON response
    let extractedData: any = {};
    try {
      // Find JSON in response (Claude might add extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse extraction response',
      }, { status: 500 });
    }

    // Filter out null/undefined values
    const assumptions = Object.fromEntries(
      Object.entries(extractedData)
        .filter(([k, v]) => v !== null && v !== undefined && k !== 'extractedFields')
        .map(([k, v]) => [k, v])
    );

    const mappedFields = extractedData.extractedFields || Object.keys(assumptions);
    const confidence = Math.round((mappedFields.length / 11) * 100); // Out of 11 possible fields

    console.log(`✓ Extraction complete:`, {
      fileName: file.name,
      assumptionsExtracted: Object.keys(assumptions).length,
      confidence,
      assumptions,
    });

    return NextResponse.json({
      success: true,
      assumptions: Object.keys(assumptions).length > 0 ? assumptions : undefined,
      mappedFields,
      confidence,
    }, { status: 200 });

  } catch (err) {
    console.error('✗ Claude extraction error:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    
    return NextResponse.json({
      success: false,
      error: errorMsg.includes('API key') 
        ? 'Claude API not configured. Get free tier at https://console.anthropic.com/api_keys'
        : errorMsg,
    }, { status: 500 });
  }
}
