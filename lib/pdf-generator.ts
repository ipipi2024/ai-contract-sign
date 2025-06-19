// lib/pdf-generator-simple.ts
import { jsPDF } from 'jspdf';

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

export async function generateContractPDF(contractJson: ContractJson, contractId: string): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Set font
  doc.setFont('times', 'normal');
  
  // Add header
  doc.setFontSize(18);
  doc.text('CONTRACT', 4.25, 1, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Date: ${currentDate}`, 4.25, 1.3, { align: 'center' });
  doc.text(`Contract ID: ${contractId}`, 4.25, 1.5, { align: 'center' });
  
  // Add line
  doc.line(1, 1.7, 7.5, 1.7);
  
  // Start content
  let yPosition = 2.2;
  const lineHeight = 0.2;
  const pageHeight = 11;
  const marginBottom = 1;
  const maxWidth = 6.5;
  
  contractJson.blocks.forEach((block) => {
    // Process text and handle signatures
    let processedText = block.text;
    
    // Replace signature placeholders
    block.signatures.forEach((signature) => {
      if (signature.img_url && signature.img_url.trim() !== '') {
        processedText = processedText.replace(/_{20}/, `[Signed: ${signature.party}]`);
      } else {
        processedText = processedText.replace(/_{20}/, `________________ (${signature.party})`);
      }
    });
    
    // Split text into lines
    const lines = doc.splitTextToSize(processedText, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPosition + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = 1;
      }
      
      doc.text(line, 1, yPosition);
      yPosition += lineHeight;
    });
    
    // Add space between blocks
    yPosition += lineHeight;
  });

  // Get the PDF as ArrayBuffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}