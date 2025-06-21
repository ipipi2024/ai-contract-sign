// lib/pdf-generator-enhanced.ts
import { jsPDF } from 'jspdf';

interface Signature {
  party: string;
  img_url: string;
  name?: string;
  date?: string;
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
    unit: 'mm',
    format: 'a4'
  });

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 25;
  const marginRight = 25;
  const marginTop = 30;
  const marginBottom = 30;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const lineHeight = 7;
  const paragraphSpacing = 10;
  const signatureLineLength = 50;

  // Colors
  const textColor = '#000000';
  const lightTextColor = '#666666';

  let currentY = marginTop;
  let currentPage = 1;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      currentPage++;
      currentY = marginTop;
      return true;
    }
    return false;
  };

  // Add professional header
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(textColor);
  
  // Contract title (centered) - use the title from contractJson
  const title = contractJson.title || 'CONTRACT AGREEMENT';
  doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  // Contract details
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  
  // Date line
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Date: ${currentDate}`, marginLeft, currentY);
  
  // Contract ID on the right
  doc.text(`Contract ID: ${contractId}`, pageWidth - marginRight, currentY, { align: 'right' });
  
  currentY += 10;

  // Add a subtle line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  
  currentY += 15;

  // Set font for contract body
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(textColor);

  // Process each contract block
  contractJson.blocks.forEach((block, blockIndex) => {
    // Process text and signatures
    let processedText = block.text;
    const signatureMap = new Map<string, Signature>();
    
    // Replace signature placeholders with markers
    block.signatures.forEach((signature, index) => {
      const marker = `__SIGNATURE_${blockIndex}_${index}__`;
      processedText = processedText.replace(/_{20,}/, marker);
      signatureMap.set(marker, signature);
    });
    
    // Split text into lines with proper width
    const lines = doc.splitTextToSize(processedText, contentWidth);
    
    // Check if we need to start a new page for this block
    const estimatedHeight = lines.length * lineHeight + paragraphSpacing;
    checkNewPage(estimatedHeight);
    
    // Render each line
    lines.forEach((line: string) => {
      // Check if line contains a signature marker
      let hasSignature = false;
      signatureMap.forEach((signature, marker) => {
        if (line.includes(marker)) {
          hasSignature = true;
          
          // Split line at marker
          const parts = line.split(marker);
          const beforeText = parts[0];
          const afterText = parts[1] || '';
          
          // Check if we need extra space for signature
          checkNewPage(40);
          
          // Render text before signature
          if (beforeText) {
            doc.text(beforeText, marginLeft, currentY);
          }
          
          // Calculate signature position
          const beforeWidth = doc.getTextWidth(beforeText);
          const signatureX = marginLeft + beforeWidth;
          
          // Draw signature section with Name, Signature, Date labels
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(textColor);
          
          let signatureY = currentY;
          
          // Name field
          doc.text('Name:', signatureX, signatureY);
          if (signature.name) {
            doc.setFont('times', 'normal');
            doc.text(signature.name, signatureX + 20, signatureY);
          } else {
            doc.setFont('times', 'normal');
            doc.text('_______________', signatureX + 20, signatureY);
          }
          signatureY += 14;
          
          // Signature field
          doc.text('Signature:', signatureX, signatureY);
          if (signature.img_url && signature.img_url.trim() !== '') {
            try {
              // Add signature image
              const imgWidth = 40;
              const imgHeight = 15;
              doc.addImage(
                signature.img_url,
                'PNG',
                signatureX + 25,
                signatureY - imgHeight + 2,
                imgWidth,
                imgHeight
              );
            } catch (error) {
              console.error(`Failed to add signature image for ${signature.party}:`, error);
              doc.text('_______________', signatureX + 25, signatureY);
            }
          } else {
            doc.text('_______________', signatureX + 25, signatureY);
          }
          signatureY += 14;
          
          // Date field
          doc.text('Date:', signatureX, signatureY);
          if (signature.date) {
            doc.setFont('times', 'normal');
            doc.text(signature.date, signatureX + 20, signatureY);
          } else {
            doc.setFont('times', 'normal');
            doc.text('_______________', signatureX + 20, signatureY);
          }
          
          // Reset font for remaining text
          doc.setFont('times', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(textColor);
          
          // Render text after signature
          if (afterText) {
            const afterX = signatureX + 80; // Give more space for signature section
            doc.text(afterText, afterX, currentY);
          }
          
          // Adjust Y position for signature section
          currentY += 20;
        }
      });
      
      // If no signature in line, render normally
      if (!hasSignature) {
        // Check for page break
        checkNewPage(lineHeight);
        
        // Justify text for professional appearance
        doc.text(line, marginLeft, currentY, { maxWidth: contentWidth });
        currentY += lineHeight;
      }
    });
    
    // Add paragraph spacing after each block
    currentY += paragraphSpacing;
  });

  // Add witness section if there are signatures
  const hasSignatures = contractJson.blocks.some(block => block.signatures.length > 0);
  if (hasSignatures) {
    checkNewPage(40);
    currentY += 10;
    
    // Witness statement
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(lightTextColor);
    doc.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.', 
      marginLeft, currentY, { maxWidth: contentWidth });
  }

  // Add footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add page numbers
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightTextColor);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Add legal notice on last page
    if (i === totalPages) {
      doc.setFontSize(9);
      doc.setFont('times', 'italic');
      doc.text('This document has been electronically signed and is legally binding.', 
        pageWidth / 2, pageHeight - 20, { align: 'center' });
    }
  }

  // Get the PDF as ArrayBuffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

// Helper function to load image as base64 (if needed for signature images)
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}