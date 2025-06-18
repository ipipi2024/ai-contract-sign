// lib/mailer.ts
import nodemailer from "nodemailer";
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { generateContractPDF } from './pdf-generator';

//Modify your mailer.ts to generate and include signing tokens:
import crypto from 'crypto';
import SigningToken from '@/models/SigningToken';

async function generateSigningToken(contractId: string, recipientEmail: string, party: string = 'PartyB') {
  const token = crypto.randomBytes(32).toString('hex');
  
  await SigningToken.create({
    token,
    contractId,
    recipientEmail,
    party,
  });
  
  return token;
}

// Update existing contract and mark as sent
async function updateContractForSending(contractId: string, contractJson: any, recipientEmail: string) {
  await connectToDatabase();
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection failed');
  }

  await db.collection('contracts').updateOne(
    { _id: new mongoose.Types.ObjectId(contractId) },
    { 
      $set: {
        content: JSON.stringify(contractJson),
        recipientEmail: recipientEmail,
        status: 'sent',
        updatedAt: new Date()
      }
    }
  );
}

// Retrieve contract from database by ID
async function getContract(contractId: string) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection failed');
    }

    const contract = await db.collection('contracts').findOne({ _id: new mongoose.Types.ObjectId(contractId) });
    return contract;
  } catch (error) {
    console.error(`Error reading contract ${contractId}:`, error);
    return null;
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendFinalizedContractEmail(contractId: string, contractJson: any, recipientEmail: string) {
    const pdfBuffer = await generateContractPDF(contractJson, contractId);

    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: recipientEmail,
        subject: "Please Review Your Finalized Contract",
        html: `
          <p>Hello,</p>
          <p>Please review the contract below:</p>
          <p>Thank you.</p>
        `,
        attachments: [
          {
            filename: `contract-${contractId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };
    
      await transporter.sendMail(mailOptions);
      return contractId;
}
// Update sendContractEmail function
export async function sendContractEmail(contractId: string, contractJson: any, recipientEmail: string) {
  await updateContractForSending(contractId, contractJson, recipientEmail);

  // Generate signing token
  const signingToken = await generateSigningToken(contractId, recipientEmail);
  
  // Use token-based URL instead of direct contract ID
  const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/sign?token=${signingToken}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: recipientEmail,
    subject: "Please Sign the Contract",
    html: `
      <p>Hello,</p>
      <p>Please review and sign the contract by clicking the link below:</p>
      <p><a href="${signUrl}" style="background: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign Contract</a></p>
      <p>This link will expire in 72 hours.</p>
      <p>Thank you.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  return contractId;
}