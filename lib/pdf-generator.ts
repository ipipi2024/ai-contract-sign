import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

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
  // Use chrome-aws-lambda for serverless environments
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    
    // Set the page size to letter format
    await page.setViewport({ width: 816, height: 1056 }); // 8.5x11 inches at 96 DPI
    
    const htmlContent = generateContractHTML(contractJson, contractId);
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateContractHTML(contractJson: ContractJson, contractId: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let blocksHTML = '';
  
  contractJson.blocks.forEach((block, index) => {
    // Process the block text to handle signatures
    let processedText = block.text;
    
    // Replace underscores with signature placeholders or actual signatures
    block.signatures.forEach((signature, sigIndex) => {
      const underscorePattern = /_{20}/;
      if (signature.img_url && signature.img_url.trim() !== '') {
        // If there's a signature image, embed it
        processedText = processedText.replace(
          underscorePattern,
          `<img src="${signature.img_url}" alt="Signature of ${signature.party}" style="height: 40px; border-bottom: 1px solid #000; display: inline-block; margin: 0 10px;">`
        );
      } else {
        // If no signature image, show signature line with party name
        processedText = processedText.replace(
          underscorePattern,
          `<span style="display: inline-block; width: 200px; border-bottom: 1px solid #000; margin: 0 10px;"></span> (${signature.party})`
        );
      }
    });

    // Convert newlines to HTML line breaks
    processedText = processedText.replace(/\n/g, '<br>');

    blocksHTML += `
      <div class="contract-block" style="margin-bottom: 20px; line-height: 1.6;">
        <p>${processedText}</p>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Contract ${contractId}</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          background: white;
        }
        .contract-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .contract-title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .contract-date {
          font-size: 12pt;
          color: #666;
        }
        .contract-block {
          margin-bottom: 20px;
          text-align: justify;
        }
        .contract-block p {
          margin: 0 0 10px 0;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          display: inline-block;
          width: 200px;
          margin: 0 10px;
        }
        @media print {
          body { print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="contract-header">
        <div class="contract-title">CONTRACT</div>
        <div class="contract-date">Date: ${currentDate}</div>
        <div class="contract-date">Contract ID: ${contractId}</div>
      </div>
      
      <div class="contract-content">
        ${blocksHTML}
      </div>
    </body>
    </html>
  `;
}