const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, default: 1 },
  unitPrice:   { type: Number, required: true },
  total:       { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    therapist:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    session:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },

    invoiceNumber: { type: String, required: true, unique: true },

    lineItems:  [lineItemSchema],
    subtotal:   { type: Number, required: true },
    tax:        { type: Number, default: 0 },
    discount:   { type: Number, default: 0 },
    total:      { type: Number, required: true },
    currency:   { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partially_paid'],
      default: 'draft',
    },

    dueDate:    { type: Date, default: null },
    paidAt:     { type: Date, default: null },
    paidAmount: { type: Number, default: 0 },

    // Razorpay
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },

    notes:      { type: String, default: '' },
    pdfPath:    { type: String, default: null }, // generated PDF path
  },
  { timestamps: true }
);

invoiceSchema.index({ therapist: 1, status: 1 });
invoiceSchema.index({ therapist: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
