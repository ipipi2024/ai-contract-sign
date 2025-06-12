// lib/mailer.ts
import nodemailer from "nodemailer";
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { generateContractPDF } from './pdf-generator';

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
export async function sendContractEmail(contractId: string, contractJson: any, recipientEmail: string) {
  await updateContractForSending(contractId, contractJson, recipientEmail);

  const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/sign/${contractId}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: recipientEmail,
    subject: "Please Sign the Contract",
    html: `
      <p>Hello,</p>
      <p>Please review and sign the contract by clicking the link below:</p>
      <p><a href="${signUrl}">Sign Contract</a></p>
      <p>Thank you.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  return contractId;
}

// Helper to retrieve contract by ID
export async function getContractById(contractId: string) {
  return await getContract(contractId);
}
