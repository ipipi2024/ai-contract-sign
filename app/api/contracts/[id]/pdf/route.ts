//app/api//contracts/[id]/pdf
import { NextRequest, NextResponse } from 'next/server';
import { generateContractPDF } from '@/lib/pdf-generator';
import { getContractById } from '@/lib/mailer';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contractId = params.id;
    
    // Get contract from database
    const contract = await getContractById(contractId);
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Parse contract content
    let contractJson;
    if (typeof contract.content === 'string') {
      contractJson = JSON.parse(contract.content);
    } else {
      contractJson = contract.content;
    }

    // Generate PDF
    const pdfBuffer = await generateContractPDF(contractJson, contractId);
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${contractId}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 


// app/api/contracts/[id]/pdf/route.ts


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { contractJson } = await request.json();
    const pdfBuffer = await generateContractPDF(contractJson, params.id);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}