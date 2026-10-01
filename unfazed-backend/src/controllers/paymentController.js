const crypto      = require("crypto");
const Razorpay    = require("razorpay");
const Payment     = require("../models/Payment");
const Package     = require("../models/Package");
const PackagePurchase = require("../models/PackagePurchase");
const Invoice     = require("../models/Invoice");
const Session     = require("../models/Session");
const Client      = require("../models/Client");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse, paginatedResponse } = require("../utils/apiResponse");
const { generateInvoicePDF } = require("../services/pdfService");
const { sendEmail }          = require("../services/emailService");
const { fireEvent }          = require("../services/notificationService");

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Helper: generate sequential invoice number ─────────────────────────────
const getInvoiceNumber = async (therapistId) => {
  const count = await Invoice.countDocuments({ therapist: therapistId });
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
};

// ────────────────────────────────────────────────────────────────────────────
// STEP 1: Create Razorpay Order
// POST /api/payments/create-order
// ────────────────────────────────────────────────────────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = "INR", receipt, notes = {} } = req.body;

  if (!amount || amount < 100) {
    return errorResponse(res, "Amount must be at least ₹1 (100 paise)", 400);
  }

  const razorpay = getRazorpay();
  const order    = await razorpay.orders.create({
    amount:   Math.round(amount),
    currency,
    receipt:  receipt || `rcpt_${Date.now()}`,
    notes:    { therapistId: req.user._id.toString(), ...notes },
  });

  return successResponse(res, {
    order_id:  order.id,
    amount:    order.amount,
    currency:  order.currency,
    key_id:    process.env.RAZORPAY_KEY_ID,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// STEP 3: Verify Payment Signature (client-side callback)
// POST /api/payments/verify
// ────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, sessionId, clientId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse(res, "Missing payment verification fields", 400);
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return errorResponse(res, "Payment signature verification failed", 400);
  }

  // Idempotency check
  const existing = await Payment.findOne({ gateway_transaction_id: razorpay_payment_id });
  if (existing) {
    return successResponse(res, { payment: existing }, "Payment already recorded");
  }

  // Find invoice and client
  const invoice = invoiceId ? await Invoice.findById(invoiceId) : null;
  const client  = clientId  ? await Client.findById(clientId)   : invoice ? await Client.findById(invoice.client) : null;

  const payment = await Payment.create({
    gateway_transaction_id: razorpay_payment_id,
    razorpay_order_id,
    therapist:   req.user._id,
    client:      client?._id || invoice?.client,
    session:     sessionId   || invoice?.session || null,
    invoice:     invoice?._id || null,
    gross_amount: invoice?.total ? invoice.total * 100 : 0,
    status:      "captured",
    webhook_verified: false,
  });

  if (invoice) {
    await Invoice.findByIdAndUpdate(invoice._id, {
      status:            "paid",
      paidAt:            new Date(),
      paidAmount:        invoice.total,
      razorpayPaymentId: razorpay_payment_id,
    });
  }

  if (sessionId) {
    await Session.findByIdAndUpdate(sessionId, { paymentStatus: "paid" });
  }

  // Fire notification
  if (client && invoice) {
    const io = req.app.get("io");
    await fireEvent("payment_received", { therapist: req.user, client, invoice, amount: invoice.total, io });
  }

  return successResponse(res, { payment }, "Payment verified successfully");
});

// ────────────────────────────────────────────────────────────────────────────
// Razorpay Webhook (server-side authoritative confirmation)
// POST /api/payments/webhook  — raw body, no auth
// ────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = asyncHandler(async (req, res) => {
  const sig    = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const body   = req.body; // Buffer (raw)

  const expected = crypto.createHmac("sha256", secret).update(body.toString()).digest("hex");
  if (sig !== expected) {
    console.warn("[Webhook] Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event   = JSON.parse(body);
  const evtName = event.event;

  if (evtName === "payment.captured") {
    const pe = event.payload?.payment?.entity;
    if (!pe) return res.json({ received: true });

    // Idempotency
    const dup = await Payment.findOne({ gateway_transaction_id: pe.id });
    if (dup) return res.json({ received: true });

    const invoice = await Invoice.findOne({ razorpayOrderId: pe.order_id });
    await Payment.create({
      gateway_transaction_id: pe.id,
      razorpay_order_id:      pe.order_id,
      therapist:     invoice?.therapist,
      client:        invoice?.client,
      session:       invoice?.session || null,
      invoice:       invoice?._id     || null,
      gross_amount:  pe.amount,
      platform_fee:  pe.fee    || 0,
      net_amount:    pe.amount - (pe.fee || 0),
      currency:      pe.currency,
      status:        "captured",
      method:        pe.method || "unknown",
      webhook_verified: true,
      webhook_payload:  event,
      captured_at:   new Date(pe.created_at * 1000),
    });

    if (invoice) {
      await Invoice.findByIdAndUpdate(invoice._id, {
        status: "paid", paidAt: new Date(), razorpayPaymentId: pe.id,
      });
      // Generate + email GST invoice PDF
      try {
        const therapist = await require("../models/User").findById(invoice.therapist);
        const buf       = await generateInvoicePDF(await invoice.populate("client"), therapist);
        if (therapist?.email) {
          await sendEmail({
            to: therapist.email, subject: "Invoice Paid",
            html: "<p>Your invoice has been paid. PDF attached.</p>",
            attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: buf }],
          });
        }
      } catch (e) { console.error("[Webhook] PDF/email error:", e.message); }
    }

    // Emit socket notification
    const io = req.app.get("io");
    if (io && invoice?.therapist) {
      io.to(`user:${invoice.therapist.toString()}`).emit("payment_received", { invoiceId: invoice?._id });
    }
  }

  if (evtName === "payment.failed") {
    const pe = event.payload?.payment?.entity;
    if (pe) await Payment.updateOne({ razorpay_order_id: pe.order_id }, { status: "failed" });
  }

  if (evtName === "order.paid") {
    const oe = event.payload?.order?.entity;
    if (oe) await Invoice.updateOne({ razorpayOrderId: oe.id, status: { $ne: "paid" } }, { status: "paid" });
  }

  return res.json({ received: true });
});

// ── GET /api/payments — list payments for therapist ────────────────────────
exports.getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find({ therapist: req.user._id })
      .populate("client", "firstName lastName email")
      .populate("invoice", "invoiceNumber total")
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Payment.countDocuments({ therapist: req.user._id }),
  ]);
  return paginatedResponse(res, payments, total, page, limit);
});

// ── Package CRUD ─────────────────────────────────────────────────────────────
exports.createPackage = asyncHandler(async (req, res) => {
  const { clientId, name, sessions_count, per_session_rate } = req.body;
  if (![3, 6, 12].includes(Number(sessions_count))) {
    return errorResponse(res, "sessions_count must be 3, 6, or 12", 400);
  }
  const pricing = Package.computePricing(Number(sessions_count), Number(per_session_rate));
  const pkg = await Package.create({
    therapist: req.user._id, client: clientId, name,
    sessions_count: Number(sessions_count),
    per_session_rate: Number(per_session_rate),
    ...pricing,
  });
  return successResponse(res, { package: pkg }, "Package created", 201);
});

exports.getPackages = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const q = { therapist: req.user._id, is_active: true };
  if (clientId) q.client = clientId;
  const packages = await Package.find(q).populate("client", "firstName lastName");
  return successResponse(res, { packages });
});

exports.purchasePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!pkg) return errorResponse(res, "Package not found", 404);

  const razorpay = getRazorpay();
  const order    = await razorpay.orders.create({
    amount:   Math.round(pkg.total_price * 100),
    currency: "INR",
    receipt:  `pkg-${pkg._id}-${Date.now()}`,
    notes:    { therapistId: req.user._id.toString(), packageId: pkg._id.toString(), clientId: pkg.client.toString() },
  });

  return successResponse(res, {
    order_id: order.id, amount: order.amount, currency: order.currency,
    key_id:   process.env.RAZORPAY_KEY_ID, package: pkg,
  });
});

exports.verifyPackagePurchase = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const pkg = await Package.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!pkg) return errorResponse(res, "Package not found", 404);

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected !== razorpay_signature) return errorResponse(res, "Signature mismatch", 400);

  const dup = await Payment.findOne({ gateway_transaction_id: razorpay_payment_id });
  if (dup) return successResponse(res, { payment: dup }, "Already recorded");

  const payment = await Payment.create({
    gateway_transaction_id: razorpay_payment_id,
    razorpay_order_id,
    therapist:   req.user._id,
    client:      pkg.client,
    gross_amount: pkg.total_price * 100,
    status:      "captured",
    webhook_verified: false,
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + pkg.validity_days);

  const purchase = await PackagePurchase.create({
    package:            pkg._id,
    client:             pkg.client,
    therapist:          req.user._id,
    sessions_remaining: pkg.sessions_count,
    sessions_used:      0,
    expiry_date:        expiryDate,
    payment_id:         payment._id,
    status:             "active",
  });

  await purchase.populate("package client");
  return successResponse(res, { purchase, payment }, "Package purchased successfully", 201);
});

exports.getPackagePurchases = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const q = { therapist: req.user._id };
  if (clientId) q.client = clientId;
  const purchases = await PackagePurchase.find(q)
    .populate("package", "name sessions_count total_price validity_days")
    .populate("client", "firstName lastName")
    .sort({ createdAt: -1 });
  return successResponse(res, { purchases });
});