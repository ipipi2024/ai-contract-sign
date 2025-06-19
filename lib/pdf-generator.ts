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
  
  // Contract title (centered)
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
          checkNewPage(25);
          
          // Render text before signature
          if (beforeText) {
            doc.text(beforeText, marginLeft, currentY);
          }
          
          // Calculate signature position
          const beforeWidth = doc.getTextWidth(beforeText);
          const signatureX = marginLeft + beforeWidth;
          
          // Draw signature line
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(signatureX, currentY + 1, signatureX + signatureLineLength, currentY + 1);
          
          // Add signature image if exists
          if (signature.img_url && signature.img_url.trim() !== '') {
            try {
              // Add signature image above the line
              const imgWidth = 40;
              const imgHeight = 15;
              doc.addImage(
                signature.img_url,
                'PNG',
                signatureX + 5,
                currentY - imgHeight + 2,
                imgWidth,
                imgHeight
              );
            } catch (error) {
              console.error(`Failed to add signature image for ${signature.party}:`, error);
            }
          }
          
          // Add party label below line
          doc.setFontSize(10);
          doc.setTextColor(lightTextColor);
          doc.setFont('times', 'italic');
          
          // Use meaningful title or name instead of Party A/Party B
          let partyLabel = '';
          
          // First priority: Check if we have parties array with meaningful titles
          if (contractJson.parties && contractJson.parties.length > 0) {
            // Map Party A/B to actual titles from parties array
            if (signature.party === 'Party A' && contractJson.parties[0]) {
              partyLabel = contractJson.parties[0];
            } else if (signature.party === 'Party B' && contractJson.parties[1]) {
              partyLabel = contractJson.parties[1];
            }
          }
          
          // Second priority: If no title or title is still generic, use the name
          if ((!partyLabel || partyLabel.startsWith('Party')) && signature.name) {
            partyLabel = signature.name;
          }
          
          // Final fallback: If still no label and we have a name, use it
          // Otherwise, just use empty string to avoid showing "Party A/B"
          if (!partyLabel) {
            partyLabel = signature.name || '';
          }
          
          // Only display if we have a meaningful label
          if (partyLabel) {
            doc.text(partyLabel, signatureX + 2, currentY + 5);
          }
          
          // Add name and date if provided
          if (signature.name || signature.date) {
            doc.setFontSize(9);
            if (signature.name) {
              doc.text(`Name: ${signature.name}`, signatureX + 2, currentY + 9);
            }
            if (signature.date) {
              doc.text(`Date: ${signature.date}`, signatureX + 2, currentY + (signature.name ? 13 : 9));
            }
          }
          
          // Reset font for remaining text
          doc.setFont('times', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(textColor);
          
          // Render text after signature
          if (afterText) {
            const afterX = signatureX + signatureLineLength + 2;
            doc.text(afterText, afterX, currentY);
          }
          
          // Adjust Y position based on signature details
          currentY += signature.name && signature.date ? 18 : (signature.name || signature.date ? 14 : 10);
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