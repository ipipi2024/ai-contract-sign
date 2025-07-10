// lib/field-contract-mailer.ts
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import SigningToken from '@/models/SigningToken';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function generateFieldSigningToken(
  contractId: string,
  recipientEmail: string
) {
  const token = crypto.randomBytes(32).toString('hex');

  await connectToDatabase();
  
  const signingToken = await SigningToken.create({
    token,
    contractId,
    recipientEmail,
    party: 'PartyB', // For field-based contracts, recipients are typically PartyB
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
  });

  return token;
}

export async function sendFieldContractEmail(
  contractId: string,
  contractContent: any,
  recipientEmail: string
) {
  // Generate signing token
  const signingToken = await generateFieldSigningToken(contractId, recipientEmail);
  
  // Create signing URL
  const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/sign?token=${signingToken}`;

  // Count required fields
  const requiredFields = contractContent.userFields?.filter(
    (field: any) => field.metadata?.required
  ).length || 0;
  
  const totalFields = contractContent.userFields?.length || 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Requires Your Input</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>  
                <td align="center" style="padding: 40px 20px 30px 20px; border-bottom: 1px solid #eeeeee;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #333333; letter-spacing: -0.5px;">
                    ${process.env.COMPANY_NAME || 'DreamSign'}
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #333333; font-weight: normal;">
                    Document Requires Your Input
                  </h2>
                  
                  <div style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                    <p>You have been requested to complete and sign the document: <strong>${contractContent.documentName || 'Contract Document'}</strong></p>
                    
                    <p>This document contains <strong>${totalFields} field${totalFields !== 1 ? 's' : ''}</strong> that require your input${requiredFields > 0 ? `, including <strong>${requiredFields} required field${requiredFields !== 1 ? 's' : ''}</strong>` : ''}.</p>
                    
                    <p>Please click the button below to access the document and complete all necessary fields.</p>
                  </div>
                  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 6px; background-color: #000000;">
                        <a href="${signUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                          Complete Document
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin: 30px 0 0 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px; font-size: 14px; color: #666666; line-height: 1.5;">
                    <strong>What to expect:</strong><br>
                    • Review the document carefully<br>
                    • Fill in all required fields marked with an asterisk (*)<br>
                    • Add your signature where indicated<br>
                    • Submit the completed document<br>
                    • This link expires in 72 hours
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 0 0 15px 0;">
                        <p style="margin: 0; font-size: 14px; color: #999999;">
                          © ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'DreamSign'}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin: 0; font-size: 14px; color: #999999;">
                          <a href="${process.env.COMPANY_WEBSITE || process.env.NEXT_PUBLIC_BASE_URL}" style="color: #666666; text-decoration: none;">
                            ${process.env.COMPANY_WEBSITE || process.env.NEXT_PUBLIC_BASE_URL}
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `${process.env.COMPANY_NAME || 'Contract Management'} <${process.env.FROM_EMAIL}>`,
    to: recipientEmail,
    subject: `Action Required: Complete and Sign "${contractContent.documentName || 'Document'}"`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  return contractId;
}