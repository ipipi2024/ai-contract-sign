// lib/pdf-field-generator.ts
import { jsPDF } from 'jspdf';

interface DocumentElement {
  type: string;
  content: string;
  formatting?: any;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
}

interface UserField {
  id: string;
  fieldType: string;
  recipientEmail: string;
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: any;
}

interface FieldValue {
  value: string | boolean | number;
  type: string;
  updatedAt: Date;
  updatedBy: string;
}

interface ContractContent {
  originalFormat: string;
  documentName: string;
  pageSize: { width: number; height: number };
  pages: number;
  elements: DocumentElement[];
  userFields: UserField[];
  fieldValues: { [fieldId: string]: FieldValue };
  metadata: any;
}

export async function generateFieldBasedPDF(
  contractContent: ContractContent,
  contractId: string
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt', // Use points to match document coordinates
    format: [contractContent.pageSize.width, contractContent.pageSize.height]
  });

  // Helper function to convert document coordinates to PDF coordinates
  const convertY = (y: number, height: number = 0) => {
    // jsPDF uses top-left origin, so no conversion needed for Y
    return y;
  };

  // Process each page
  for (let pageNum = 1; pageNum <= contractContent.pages; pageNum++) {
    if (pageNum > 1) {
      doc.addPage();
    }

    // Render original document elements for this page
    const pageElements = contractContent.elements.filter(
      el => el.position?.page === pageNum
    );

    for (const element of pageElements) {
      if (!element.position) continue;

      const { x, y, width, height } = element.position;
      const fontSize = element.formatting?.fontSize || 12;
      const fontFamily = element.formatting?.fontFamily || 'helvetica';
      const bold = element.formatting?.bold || false;
      const italic = element.formatting?.italic || false;

      // Set font
      let fontStyle = 'normal';
      if (bold && italic) fontStyle = 'bolditalic';
      else if (bold) fontStyle = 'bold';
      else if (italic) fontStyle = 'italic';

      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(fontSize);

      // Set text color
      if (element.formatting?.color) {
        const color = element.formatting.color;
        if (color.startsWith('#')) {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          doc.setTextColor(r, g, b);
        }
      } else {
        doc.setTextColor(0, 0, 0);
      }

      // Render text
      if (element.type === 'text' || element.type === 'paragraph' || element.type === 'heading') {
        doc.text(element.content, x, convertY(y) + fontSize, {
          maxWidth: width,
          align: element.formatting?.alignment || 'left'
        });
      }
    }

    // Render user-defined fields for this page
    const pageFields = contractContent.userFields.filter(
      field => field.page === pageNum
    );

    for (const field of pageFields) {
      const fieldValue = contractContent.fieldValues[field.id];
      const { x, y, width, height } = field.position;

      // Draw field background
      doc.setFillColor(245, 245, 245);
      doc.rect(x, convertY(y), width, height, 'F');

      // Draw field border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(x, convertY(y), width, height, 'S');

      if (fieldValue?.value !== undefined && fieldValue.value !== '') {
        // Render field value based on type
        switch (field.fieldType) {
          case 'signature':
            if (typeof fieldValue.value === 'string' && fieldValue.value.startsWith('data:image')) {
              try {
                // Add signature image
                doc.addImage(
                  fieldValue.value,
                  'PNG',
                  x + 5,
                  convertY(y) + 5,
                  width - 10,
                  height - 10,
                  undefined,
                  'FAST'
                );
              } catch (error) {
                console.error('Error adding signature image:', error);
              }
            }
            break;

          case 'checkbox':
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            if (fieldValue.value === true || fieldValue.value === 'true') {
              // Draw checkmark
              doc.text('✓', x + width / 2, convertY(y) + height / 2 + 5, {
                align: 'center'
              });
            }
            break;

          case 'date':
          case 'text':
          case 'email':
          case 'name':
          case 'number':
            const fontSize = field.metadata?.fontSize || 12;
            const textAlign = field.metadata?.textAlign || 'left';
            
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            
            // Calculate text position based on alignment
            let textX = x + 5;
            if (textAlign === 'center') textX = x + width / 2;
            else if (textAlign === 'right') textX = x + width - 5;
            
            doc.text(
              String(fieldValue.value),
              textX,
              convertY(y) + height / 2 + fontSize / 3,
              {
                align: textAlign,
                maxWidth: width - 10
              }
            );
            break;

          case 'dropdown':
            const dropdownFontSize = field.metadata?.fontSize || 12;
            doc.setFontSize(dropdownFontSize);
            doc.setTextColor(0, 0, 0);
            doc.text(
              String(fieldValue.value),
              x + 5,
              convertY(y) + height / 2 + dropdownFontSize / 3,
              {
                maxWidth: width - 10
              }
            );
            break;

          case 'radio':
          case 'initial':
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(
              String(fieldValue.value),
              x + 5,
              convertY(y) + height / 2 + 4,
              {
                maxWidth: width - 10
              }
            );
            break;
        }
      } else if (field.metadata?.placeholder) {
        // Show placeholder text for empty fields
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
          field.metadata.placeholder,
          x + 5,
          convertY(y) + height / 2 + 3,
          {
            maxWidth: width - 10
          }
        );
      }

      // Add field label if it's required
      if (field.metadata?.required && !fieldValue?.value) {
        doc.setFontSize(8);
        doc.setTextColor(255, 0, 0);
        doc.text('*Required', x, convertY(y) - 2);
      }
    }
  }

  // Add footer with metadata
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add page numbers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      contractContent.pageSize.width / 2,
      contractContent.pageSize.height - 20,
      { align: 'center' }
    );
    
    // Add document info on last page
    if (i === totalPages) {
      doc.setFontSize(8);
      doc.text(
        `Document ID: ${contractId} | Generated: ${new Date().toLocaleDateString()}`,
        contractContent.pageSize.width / 2,
        contractContent.pageSize.height - 10,
        { align: 'center' }
      );
    }
  }

  // Get the PDF as ArrayBuffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}