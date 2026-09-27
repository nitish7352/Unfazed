const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @param {object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV === 'test') return { accepted: [to] };

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
};

/**
 * Session reminder email to therapist
 */
const sendSessionReminder = async (therapistEmail, therapistName, clientName, sessionTime) => {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#6366f1;">Session Reminder — Unfazed</h2>
      <p>Hi ${therapistName},</p>
      <p>This is a reminder that you have an upcoming session with <strong>${clientName}</strong>.</p>
      <p><strong>Time:</strong> ${new Date(sessionTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <p>Log in to <a href="${process.env.CLIENT_URL}">Unfazed</a> to prepare.</p>
      <hr/>
      <small>You're receiving this because notifications are enabled in your Unfazed account.</small>
    </div>
  `;
  return sendEmail({ to: therapistEmail, subject: `Session Reminder: ${clientName}`, html });
};

/**
 * Invoice sent email to client
 */
const sendInvoiceEmail = async (clientEmail, clientName, invoiceNumber, amount, currency, invoiceLink) => {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#6366f1;">Invoice from Unfazed</h2>
      <p>Hi ${clientName},</p>
      <p>Invoice <strong>#${invoiceNumber}</strong> for <strong>${currency} ${amount}</strong> has been sent to you.</p>
      ${invoiceLink ? `<p><a href="${invoiceLink}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Pay Now</a></p>` : ''}
      <hr/>
      <small>This is an automated message from Unfazed.</small>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject: `Invoice #${invoiceNumber} — Unfazed`, html });
};

module.exports = { sendEmail, sendSessionReminder, sendInvoiceEmail };
