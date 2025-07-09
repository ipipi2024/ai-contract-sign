// lib/pdf/insert-field-in-pdf.ts
import { PDFDocument, PDFTextField, rgb, StandardFonts } from 'pdf-lib';

export interface PDFField {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  placeholder?: string;
  required?: boolean;
  value?: string;
  options?: string[];
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export async function insertFieldInPDF(pdfDoc: PDFDocument, field: PDFField) {
  const pages = pdfDoc.getPages();
  const page = pages[field.page - 1];
  
  if (!page) {
    throw new Error(`Page ${field.page} does not exist`);
  }

  const form = pdfDoc.getForm();
  const { height: pageHeight } = page.getSize();

  // Convert Y coordinate (PDF uses bottom-left origin)
  const pdfY = pageHeight - field.y - field.height;

  switch (field.type) {
    case 'TEXT':
    case 'EMAIL':
    case 'NAME':
    case 'NUMBER': {
      const textField = form.createTextField(`${field.type.toLowerCase()}_${field.id}`);
      textField.setText(field.value || '');
      
      if (field.placeholder) {
        // PDF-lib doesn't support placeholders directly, so we'll use default text
        if (!field.value) {
          textField.setText('');
        }
      }

      textField.addToPage(page, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
        backgroundColor: rgb(1, 1, 1),
      });

      if (field.fontSize) {
        textField.setFontSize(field.fontSize);
      }
      break;
    }

    case 'DATE': {
      const dateField = form.createTextField(`date_${field.id}`);
      dateField.setText(field.value || '');
      
      dateField.addToPage(page, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
        backgroundColor: rgb(1, 1, 1),
      });
      break;
    }

    case 'SIGNATURE':
    case 'INITIALS': {
      // For signatures, we'll create a rectangle area
      // In a real implementation, this would be handled by the signing process
      page.drawRectangle({
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.4, 0.8),
        color: rgb(0.95, 0.95, 1),
      });

      // Add label
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(field.type, {
        x: field.x + 5,
        y: pdfY + field.height / 2 - 5,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      break;
    }

    case 'CHECKBOX': {
      const checkboxes = field.options || ['Option 1'];
      let yOffset = 0;
      
      checkboxes.forEach((option, index) => {
        const checkbox = form.createCheckBox(`checkbox_${field.id}_${index}`);
        checkbox.addToPage(page, {
          x: field.x,
          y: pdfY - yOffset,
          width: 15,
          height: 15,
          borderWidth: 1,
          borderColor: rgb(0.5, 0.5, 0.5),
        });

        // Add label
        const helveticaFont = pdfDoc.embedFont(StandardFonts.Helvetica).then(font => {
          page.drawText(option, {
            x: field.x + 20,
            y: pdfY - yOffset + 2,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
        });

        yOffset += 20;
      });
      break;
    }

    case 'RADIO': {
      const radioGroup = form.createRadioGroup(`radio_${field.id}`);
      const options = field.options || ['Option 1'];
      let yOffset = 0;

      options.forEach((option, index) => {
        radioGroup.addOptionToPage(option, page, {
          x: field.x,
          y: pdfY - yOffset,
          width: 15,
          height: 15,
          borderWidth: 1,
          borderColor: rgb(0.5, 0.5, 0.5),
        });

        // Add label
        const helveticaFont = pdfDoc.embedFont(StandardFonts.Helvetica).then(font => {
          page.drawText(option, {
            x: field.x + 20,
            y: pdfY - yOffset + 2,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
        });

        yOffset += 20;
      });
      break;
    }

    case 'DROPDOWN': {
      const dropdown = form.createDropdown(`dropdown_${field.id}`);
      dropdown.addOptions(field.options || ['Option 1']);
      
      dropdown.addToPage(page, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
        backgroundColor: rgb(1, 1, 1),
      });
      break;
    }

    default:
      console.warn(`Unsupported field type: ${field.type}`);
  }
}