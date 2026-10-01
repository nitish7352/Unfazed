const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Detect placeholder/example values that aren't real keys
const REAL_KEY_ID     = 'rzp_test_TiNBqobbpz64rc';
const REAL_KEY_SECRET = 'PST0SEgyQAjZdbmdp1kwc7tz';
// Use env var only if it looks like a real key (not a placeholder like rzp_test_XXXXXXXXXX)
const isValidRzpKey    = (v) => v && v.startsWith('rzp_') && v.length > 20 && !v.includes('XXXX') && !v.includes('your');
const isValidRzpSecret = (v) => v && v.length >= 20 && !v.includes('your_') && !v.includes('secret') && !v.includes('XXXX');

const RZP_KEY_ID     = isValidRzpKey(process.env.RAZORPAY_KEY_ID)         ? process.env.RAZORPAY_KEY_ID.trim()     : 'rzp_test_TiNBqobbpz64rc';
const RZP_KEY_SECRET = isValidRzpSecret(process.env.RAZORPAY_KEY_SECRET)  ? process.env.RAZORPAY_KEY_SECRET.trim() : 'PST0SEgyQAjZdbmdp1kwc7tz';

const getRazorpay = () => new Razorpay({
  key_id:     RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});

// Generate a unique invoice number using timestamp + random suffix to avoid
// duplicate key errors when invoices have been deleted (count-based numbering
// breaks when documents are removed from the collection).
const generateInvoiceNumber = async (therapistId) => {
  const year    = new Date().getFullYear();
  const month   = String(new Date().getMonth() + 1).padStart(2, '0');
  const random  = Math.random().toString(36).substring(2, 6).toUpperCase();
  const base    = `INV-${year}${month}-${random}`;

  // Extremely unlikely, but guard against the rare collision
  const exists = await Invoice.findOne({ invoiceNumber: base });
  if (exists) {
    const extra = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${base}-${extra}`;
  }
  return base;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, clientId, startDate, endDate } = req.query;
  const skip = (page - 1) * limit;

  const query = { therapist: req.user._id };
  if (status)   query.status = status;
  if (clientId) query.client = clientId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate)   query.createdAt.$lte = new Date(endDate);
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('client', 'firstName lastName email')
      .populate('session', 'startTime type modality')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Invoice.countDocuments(query),
  ]);

  return paginatedResponse(res, invoices, total, page, limit);
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id })
    .populate('client', 'firstName lastName email phone address')
    .populate('session', 'startTime type modality duration');

  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, { invoice });
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { clientId, sessionId, lineItems, tax = 0, discount = 0, dueDate, notes } = req.body;

  const client = await Client.findOne({ _id: clientId, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + tax - discount;

  const invoice = await Invoice.create({
    therapist: req.user._id,
    client:    clientId,
    session:   sessionId || null,
    invoiceNumber: await generateInvoiceNumber(req.user._id),
    lineItems,
    subtotal,
    tax,
    discount,
    total,
    dueDate: dueDate ? new Date(dueDate) : null,
    notes,
    status: 'draft',
  });

  await invoice.populate('client', 'firstName lastName email');
  return successResponse(res, { invoice }, 'Invoice created', 201);
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (invoice.status === 'paid') return errorResponse(res, 'Cannot edit a paid invoice', 400);

  const { lineItems, tax, discount, dueDate, notes, status } = req.body;

  if (lineItems) {
    invoice.lineItems = lineItems;
    invoice.subtotal  = lineItems.reduce((sum, item) => sum + item.total, 0);
    invoice.tax       = tax ?? invoice.tax;
    invoice.discount  = discount ?? invoice.discount;
    invoice.total     = invoice.subtotal + invoice.tax - invoice.discount;
  }
  if (dueDate)  invoice.dueDate = new Date(dueDate);
  if (notes)    invoice.notes = notes;
  if (status)   invoice.status = status;

  await invoice.save();
  await invoice.populate('client', 'firstName lastName email');
  return successResponse(res, { invoice }, 'Invoice updated');
});

// @desc    Create Razorpay order for invoice
// @route   POST /api/invoices/:id/order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (invoice.status === 'paid') return errorResponse(res, 'Invoice already paid', 400);

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount:   Math.round(invoice.total * 100), // paise
    currency: invoice.currency || 'INR',
    receipt:  invoice.invoiceNumber,
    notes:    { invoiceId: invoice._id.toString(), therapistId: req.user._id.toString() },
  });

  invoice.razorpayOrderId = order.id;
  await invoice.save();

  return successResponse(res, {
    orderId:   order.id,
    amount:    order.amount,
    currency:  order.currency,
    keyId:     RZP_KEY_ID,
    invoiceId: invoice._id,
  });
});

// @desc    Verify & record Razorpay payment
// @route   POST /api/invoices/:id/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  const expectedSignature = crypto
    .createHmac('sha256', RZP_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return errorResponse(res, 'Payment verification failed: invalid signature', 400);
  }

  invoice.razorpayPaymentId = razorpay_payment_id;
  invoice.status     = 'paid';
  invoice.paidAt     = new Date();
  invoice.paidAmount = invoice.total;
  await invoice.save();

  // Update session payment status
  if (invoice.session) {
    await Session.findByIdAndUpdate(invoice.session, { paymentStatus: 'paid' });
  }

  // Update client total paid
  await Client.findByIdAndUpdate(invoice.client, {
    $inc: { totalAmountPaid: invoice.total },
  });

  return successResponse(res, { invoice }, 'Payment verified and recorded');
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (invoice.status === 'paid') return errorResponse(res, 'Cannot delete a paid invoice', 400);

  await invoice.deleteOne();
  return successResponse(res, {}, 'Invoice deleted');
});

module.exports = {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  createRazorpayOrder, verifyPayment, deleteInvoice,
};
