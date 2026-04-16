'use strict';

const nodemailer = require('nodemailer');

// ─── TRANSPORTER ─────────────────────────────────────────────────────────────
// Configured once; reused across all calls.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,          // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Use a Gmail App Password, NOT your account password
  },
});

/**
 * Sends the insurance contract PDF to the client by email.
 * ⚠️  FAIL-SAFE: this function NEVER throws — errors are logged only.
 *     Payment must NOT depend on email delivery.
 *
 * @param {Object}  opts
 * @param {string}  opts.to                Recipient email address
 * @param {Buffer}  opts.pdfBuffer         PDF file as a Buffer
 * @param {string}  opts.policy_reference  Used in subject line and filename
 * @returns {Promise<void>}
 */
async function sendContractEmail({ to, pdfBuffer, policy_reference }) {
  try {
    await transporter.sendMail({
      from: `"CAAR Insurance" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your Insurance Contract - CAAR',
      text: 'Your contract has been successfully created. Please find it attached.',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#003D7A;padding:24px 32px;border-radius:6px 6px 0 0">
            <h2 style="color:#fff;margin:0">CAAR Insurance</h2>
            <p style="color:#C8A951;margin:4px 0 0">Compagnie Algérienne des Assurances et de Réassurance</p>
          </div>
          <div style="padding:32px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px">
            <p style="font-size:15px;color:#333">Dear Client,</p>
            <p style="font-size:15px;color:#333">
              Your insurance contract has been <strong>successfully created</strong>.
              Please find your contract attached to this email.
            </p>
            <div style="background:#F4F6F9;border-left:4px solid #003D7A;padding:12px 16px;margin:20px 0;border-radius:0 4px 4px 0">
              <p style="margin:0;color:#003D7A;font-weight:bold">Policy Reference</p>
              <p style="margin:4px 0 0;color:#555;font-size:16px">${policy_reference}</p>
            </div>
            <p style="font-size:13px;color:#777;margin-top:32px">
              This is an automated email. Please do not reply directly.<br>
              For assistance, contact us at <a href="mailto:contact@caar.dz" style="color:#003D7A">contact@caar.dz</a>
              or visit <a href="https://www.caar.dz" style="color:#003D7A">www.caar.dz</a>.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `contract-${policy_reference}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[mailer] Contract email sent to ${to} (ref: ${policy_reference})`);
  } catch (err) {
    // ⚠️  FAIL-SAFE: log the error but do NOT re-throw.
    // Payment is already committed — email failure must never roll it back.
    console.error(`[mailer] Failed to send contract email to ${to}:`, err.message);
  }
}

module.exports = { sendContractEmail };