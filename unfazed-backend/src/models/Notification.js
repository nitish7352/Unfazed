const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'session_reminder', 'session_confirmed', 'session_cancelled',
        'invoice_paid', 'invoice_overdue', 'new_client',
        'note_reminder', 'subscription_expiry', 'general'
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: null }, // frontend route
    isRead:  { type: Boolean, default: false },
    readAt:  { type: Date, default: null },

    // Related entities
    relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    relatedClient:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    relatedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
