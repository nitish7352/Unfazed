/**
 * Notification Service — Module 6
 * Event-driven notifications: email (Nodemailer) + stubbed WhatsApp/SMS.
 * Fire on domain events: booking confirmed, 24hr reminder, payment received, etc.
 */
const { sendEmail } = require("./emailService");
const Notification  = require("../models/Notification");

/**
 * Fire a domain event notification.
 * @param {string} event - booking_confirmed | payment_received | session_reminder | session_cancelled | invoice_sent
 * @param {object} payload - { therapist, client, session?, invoice?, amount? }
 */
async function fireEvent(event, payload) {
  const { therapist, client, session, invoice, amount } = payload;
  const io = payload.io; // socket.io instance (optional)

  try {
    switch (event) {
      case "booking_confirmed":
        await _bookingConfirmed(therapist, client, session, io);
        break;
      case "payment_received":
        await _paymentReceived(therapist, client, invoice, amount, io);
        break;
      case "session_reminder":
        await _sessionReminder(therapist, client, session);
        break;
      case "session_cancelled":
        await _sessionCancelled(therapist, client, session, io);
        break;
      case "invoice_sent":
        await _invoiceSent(therapist, client, invoice, io);
        break;
      default:
        console.log(`[NotificationService] Unknown event: ${event}`);
    }
  } catch (err) {
    // Never throw — notification failures are non-fatal
    console.error(`[NotificationService] Error on event '${event}':`, err.message);
  }
}

async function _bookingConfirmed(therapist, client, session, io) {
  const title   = "Session Confirmed";
  const message = `Your session with ${client?.firstName || "your client"} is confirmed for ${session?.startTime ? new Date(session.startTime).toLocaleString("en-IN") : "the scheduled time"}.`;

  // In-app notification
  await _createNotification(therapist._id, "session_confirmed", title, message, session?._id, client?._id, io);

  // Email
  if (therapist.email) {
    await sendEmail({ to: therapist.email, subject: title, html: `<p>${message}</p>` }).catch(() => {});
  }

  // WhatsApp stub
  _whatsappStub("booking_confirmed", { therapist, client, session });
}

async function _paymentReceived(therapist, client, invoice, amount, io) {
  const title   = "Payment Received";
  const message = `Payment of ₹${amount?.toLocaleString("en-IN") || invoice?.total?.toLocaleString("en-IN")} received from ${client?.firstName || "client"}.`;

  await _createNotification(therapist._id, "invoice_paid", title, message, null, client?._id, io);

  if (therapist.email) {
    await sendEmail({ to: therapist.email, subject: title, html: `<p>${message}</p>` }).catch(() => {});
  }

  _whatsappStub("payment_received", { therapist, client, invoice, amount });
}

async function _sessionReminder(therapist, client, session) {
  const title   = "Session Reminder";
  const message = `Reminder: session with ${client?.firstName || "client"} in 24 hours.`;

  await _createNotification(therapist._id, "session_reminder", title, message, session?._id, client?._id, null);

  if (therapist.email) {
    await sendEmail({ to: therapist.email, subject: title, html: `<p>${message}</p>` }).catch(() => {});
  }

  _whatsappStub("session_reminder", { therapist, client, session });
}

async function _sessionCancelled(therapist, client, session, io) {
  const title   = "Session Cancelled";
  const message = `Session with ${client?.firstName || "client"} has been cancelled.`;

  await _createNotification(therapist._id, "session_cancelled", title, message, session?._id, client?._id, io);
}

async function _invoiceSent(therapist, client, invoice, io) {
  const title   = "Invoice Sent";
  const message = `Invoice #${invoice?.invoiceNumber} sent to ${client?.firstName || "client"}.`;

  await _createNotification(therapist._id, "invoice_paid", title, message, null, client?._id, io);
}

async function _createNotification(recipientId, type, title, message, sessionId, clientId, io) {
  if (!recipientId) return;

  const notification = await Notification.create({
    recipient:      recipientId,
    type,
    title,
    message,
    relatedSession: sessionId || null,
    relatedClient:  clientId  || null,
  });

  // Emit real-time via Socket.io if available
  if (io) {
    io.to(`user:${recipientId.toString()}`).emit("notification", {
      _id:     notification._id,
      type,
      title,
      message,
      isRead:  false,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

/**
 * WhatsApp stub — logs the event to console / queue.
 * Replace with real WhatsApp Business API when access is approved.
 */
function _whatsappStub(event, data) {
  const log = {
    channel:   "whatsapp",
    event,
    to:        data.client?.phone || "NO_PHONE",
    timestamp: new Date().toISOString(),
    payload:   { clientName: data.client?.firstName, therapistName: data.therapist?.firstName },
  };
  console.log("[WhatsApp STUB]", JSON.stringify(log));
  // TODO: Replace with real WhatsApp Business API / Twilio / MessageBird call
}

module.exports = { fireEvent };