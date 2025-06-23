// lib/mailer.ts
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { generateContractPDF } from "./pdf-generator";
import crypto from "crypto";
import SigningToken from "@/models/SigningToken";

async function generateSigningToken(
  contractId: string,
  recipientEmail: string,
  party: string = "PartyB"
) {
  const token = crypto.randomBytes(32).toString("hex");

  console.log("Generating signing token for contract:", contractId);

  const signingToken = await SigningToken.create({
    token,
    contractId,
    recipientEmail,
    party,
  });

  console.log("Created signing token:", signingToken);

  return token;
}

// Update existing contract and mark as sent
async function updateContractForSending(
  contractId: string,
  contractJson: any,
  recipientEmail: string
) {
  await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection failed");
  }

  await db.collection("contracts").updateOne(
    { _id: new mongoose.Types.ObjectId(contractId) },
    {
      $set: {
        content: JSON.stringify(contractJson),
        recipientEmail: recipientEmail,
        status: "sent",
        updatedAt: new Date(),
      },
    }
  );
}

// Retrieve contract from database by ID
async function getContract(contractId: string) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection failed");
    }

    const contract = await db
      .collection("contracts")
      .findOne({ _id: new mongoose.Types.ObjectId(contractId) });
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

// Professional email template generator
function generateEmailTemplate(content: {
  recipientName?: string;
  title: string;
  message: string;
  actionButton?: {
    text: string;
    url: string;
  };
  additionalInfo?: string;
}) {
  const companyName = process.env.COMPANY_NAME || "DreamSign";
  const companyWebsite =
    process.env.COMPANY_WEBSITE || process.env.NEXT_PUBLIC_BASE_URL;
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/images/full-logo.png`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.title}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
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
      ${companyName}
    </h1>
  </td>
</tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${
                    content.recipientName
                      ? `<h2 style="margin: 0 0 20px 0; font-size: 24px; color: #333333; font-weight: normal;">Hello ${content.recipientName},</h2>`
                      : ""
                  }
                  
                  <div style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                    ${content.message}
                  </div>
                  
                  ${
                    content.actionButton
                      ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #000000;">
                          <a href="${content.actionButton.url}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            ${content.actionButton.text}
                          </a>
                        </td>
                      </tr>
                    </table>
                  `
                      : ""
                  }
                  
                  ${
                    content.additionalInfo
                      ? `
                    <div style="margin: 30px 0 0 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px; font-size: 14px; color: #666666; line-height: 1.5;">
                      ${content.additionalInfo}
                    </div>
                  `
                      : ""
                  }
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" style="padding: 0 0 15px 0;">
                        <p style="margin: 0; font-size: 14px; color: #999999;">
                          © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin: 0; font-size: 14px; color: #999999;">
                          <a href="${companyWebsite}" style="color: #666666; text-decoration: none;">${companyWebsite}</a>
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
}

export async function sendFinalizedContractEmail(
  contractId: string,
  contractJson: any,
  recipientEmail: string
) {
  console.log("Starting sendFinalizedContractEmail with:", {
    contractId,
    recipientEmail,
  });

  try {
    const pdfBuffer = await generateContractPDF(contractJson, contractId);
    console.log("PDF generated successfully, size:", pdfBuffer.length);

    // Get the sender's email from the contract
    const contract = await getContract(contractId);

    if (!contract) {
      throw new Error("Contract not found");
    }

    console.log("Contract found:", {
      contractId: contract._id,
      userId: contract.userId,
    });

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection failed");
    }

    const senderEmail = contract.userId
      ? (
          await db
            .collection("users")
            .findOne({ _id: new mongoose.Types.ObjectId(contract.userId) })
        )?.email
      : null;

    console.log("Sender email found:", senderEmail);

    if (!senderEmail) {
      throw new Error("Sender email not found");
    }

    // Send to both parties
    const recipients = [recipientEmail, senderEmail].filter(Boolean);
    console.log("Sending to recipients:", recipients);

    // Send separate emails to each recipient to avoid deduplication
    const emailPromises = recipients.map(async (email) => {
      const htmlContent = generateEmailTemplate({
        title: "Contract Finalized",
        message: `
            <p>We're pleased to inform you that the contract has been successfully finalized and signed by all parties.</p>
            <p>The fully executed contract is attached to this email for your records. Please save this document in a secure location as it represents a legally binding agreement between all parties.</p>
            <p>If you have any questions or need any clarification regarding the contract, please don't hesitate to reach out.</p>
          `,
        additionalInfo: `
            <strong>Important Information:</strong><br>
            • This is a legally binding document<br>
            • Keep this contract for your records<br>
            • All parties have completed their signatures<br>
            • Contract ID: ${contractId}
          `,
      });

      const mailOptions = {
        from: `${process.env.COMPANY_NAME || "Contract Management"} <${
          process.env.FROM_EMAIL
        }>`,
        to: email,
        subject:
          "Contract Successfully Finalized - Action Required: Save for Your Records",
        html: htmlContent,
        attachments: [
          {
            filename: `contract-${contractId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      console.log(`Sending email to ${email} with options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasAttachment: !!mailOptions.attachments.length,
      });

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log("All emails sent successfully");
    return contractId;
  } catch (error) {
    console.error("Error in sendFinalizedContractEmail:", error);
    throw error;
  }
}

// Update sendContractEmail function
export async function sendContractEmail(
  contractId: string,
  contractJson: any,
  recipientEmail: string
) {
  await updateContractForSending(contractId, contractJson, recipientEmail);

  // Generate signing token
  const signingToken = await generateSigningToken(contractId, recipientEmail);

  // Use token-based URL instead of direct contract ID
  const signUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/sign?token=${signingToken}`;

  const htmlContent = generateEmailTemplate({
    title: "Contract Signature Request",
    message: `
      <p>You have been requested to review and sign an important contract document.</p>
      <p>Please take a moment to carefully review the contract terms and conditions before signing. Once you've reviewed the document, you can sign it electronically using the secure link below.</p>
      <p>For your security, this link will expire in 72 hours. If you need additional time, please contact the sender.</p>
    `,
    actionButton: {
      text: "Review and Sign Contract",
      url: signUrl,
    },
    additionalInfo: `
      <strong>Before signing, please ensure:</strong><br>
      • You have read and understood all terms<br>
      • You agree to the conditions outlined<br>
      • Your information is accurate<br>
      • This link expires in 72 hours
    `,
  });

  const mailOptions = {
    from: `${process.env.COMPANY_NAME || "Contract Management"} <${
      process.env.FROM_EMAIL
    }>`,
    to: recipientEmail,
    subject: "Action Required: Contract Signature Request",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  return contractId;
}

// Helper to retrieve contract by ID
export async function getContractById(contractId: string) {
  return await getContract(contractId);
}
