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
    console.log('Starting sendFinalizedContractEmail with:', { contractId, recipientEmail });
    
    try {
      const pdfBuffer = await generateContractPDF(contractJson, contractId);
      console.log('PDF generated successfully, size:', pdfBuffer.length);

      // Get the sender's email from the contract
      const contract = await getContract(contractId);
      
      if (!contract) {
        throw new Error('Contract not found');
      }

      console.log('Contract found:', { contractId: contract._id, userId: contract.userId });

      await connectToDatabase();
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection failed');
      }

      const senderEmail = contract.userId ? (await db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId(contract.userId) }
      ))?.email : null;

      console.log('Sender email found:', senderEmail);

      if (!senderEmail) {
        throw new Error('Sender email not found');
      }

      // Send to both parties
      const recipients = [recipientEmail, senderEmail].filter(Boolean);
      console.log('Sending to recipients:', recipients);

      // Send separate emails to each recipient to avoid deduplication
      const emailPromises = recipients.map(async (email) => {
        const mailOptions = {
          from: process.env.FROM_EMAIL,
          to: email,
          subject: "Finalized Contract",
          html: `
            <p>Hello,</p>
            <p>The contract has been finalized and signed by all parties. Please find the completed contract attached.</p>
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
        
        console.log(`Sending email to ${email} with options:`, { 
          from: mailOptions.from, 
          to: mailOptions.to, 
          subject: mailOptions.subject,
          hasAttachment: !!mailOptions.attachments.length
        });
        
        return transporter.sendMail(mailOptions);
      });
      
      await Promise.all(emailPromises);
      console.log('All emails sent successfully');
      return contractId;
    } catch (error) {
      console.error('Error in sendFinalizedContractEmail:', error);
      throw error;
    }
}

export async function sendContractEmail(contractId: string, contractJson: any, recipientEmail: string) {
  await updateContractForSending(contractId, contractJson, recipientEmail);

  // Get the sender's email from the contract
  const contract = await getContract(contractId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }

  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  const senderEmail = contract.userId ? (await db.collection('users').findOne(
    { _id: new mongoose.Types.ObjectId(contract.userId) }
  ))?.email : null;

  if (!senderEmail) {
    throw new Error('Sender email not found');
  }

  const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/sign/${contractId}`;

  // Send email to recipient (signing invitation)
  const recipientMailOptions = {
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

  // Send email to sender (confirmation)
  const senderMailOptions = {
    from: process.env.FROM_EMAIL,
    to: senderEmail,
    subject: "Contract Sent Successfully",
    html: `
      <p>Hello,</p>
      <p>Your contract has been sent successfully to ${recipientEmail}.</p>
      <p>You will be notified when the contract is signed and finalized.</p>
      <p>Thank you.</p>
    `,
  };

  // Send both emails
  await Promise.all([
    transporter.sendMail(recipientMailOptions),
    transporter.sendMail(senderMailOptions)
  ]);

  return contractId;
}

// Helper to retrieve contract by ID
export async function getContractById(contractId: string) {
  return await getContract(contractId);
}