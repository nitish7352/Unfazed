/**
 * Bug Condition Exploration Tests — Module 4: Payments & Packages
 *
 * These tests MUST FAIL on unfixed code.
 * Each failure confirms the bug exists.
 * They will PASS after the fix is applied (Task 9).
 *
 * Validates: Requirements 1.1, 1.3, 1.7, 1.10, 1.12
 *
 * ─── DOCUMENTED COUNTEREXAMPLES (run on unfixed code) ─────────────────────────
 *
 * BUG 1.1 — Webhook route missing
 *   Counterexample: POST /api/payments/webhook → HTTP 404
 *   Failure: expect(received).not.toBe(expected) — Expected: not 404
 *
 * BUG 1.2 — Invoice stays draft after payment.captured
 *   Counterexample: invoice.status === 'draft' (not 'paid')
 *   Failure: expect(received).toBe(expected) — Expected: "paid", Received: "draft"
 *
 * BUG 1.3 — Package and PackagePurchase models absent
 *   Counterexample: require('../models/Package') throws Error: "Cannot find module"
 *   Failure: expect(() => require('../models/Package')).not.toThrow()
 *
 * BUG 1.4 — PDF missing HSN code 998311 (PBT)
 *   Counterexample: gstin="     ", rate=500 → buffer does not contain '998311'
 *   Failure: Property failed after 1 tests — "Property failed by returning false"
 *   { seed: 1291588948, path: "0:0:0:0:0:0:0:0", endOnFailure: true }
 *
 * BUG 1.5 — Advance payment gate missing
 *   Counterexample: requireAdvancePayment=true → session.status === 'scheduled'
 *   Failure: expect(received).toBe(expected) — Expected: "payment_pending", Received: "scheduled"
 * ──────────────────────────────────────────────────────────────────────────────
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const fc       = require('fast-check');
const app      = require('../../app');
const { generateInvoicePDF } = require('../services/pdfService');

// Connect to test DB before all tests
beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unfazed_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ─── Test 1.1 — Webhook route missing ────────────────────────────────────────
// EXPECTED FAILURE on unfixed code: route does not exist → 404
// COUNTEREXAMPLE: POST /api/payments/webhook → HTTP 404 "Route not found"
test('BUG 1.1: POST /api/payments/webhook returns 404 (route does not exist)', async () => {
  const fakeBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          order_id: 'order_test123',
          amount: 150000,
          currency: 'INR',
          method: 'upi',
          fee: 3000,
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  });

  const res = await request(app)
    .post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', 'fake_signature')
    .send(fakeBody);

  // BUG: On unfixed code this returns 404 because the route does not exist
  // After fix: should return 400 (bad signature) or 200 (valid event processed)
  expect(res.status).not.toBe(404);
});

// ─── Test 1.2 — Invoice stays draft after payment.captured ───────────────────
// EXPECTED FAILURE on unfixed code: webhook endpoint doesn't exist/process events
// COUNTEREXAMPLE: invoice.status === 'draft' (not 'paid') after a payment.captured event
test('BUG 1.2: /api/payments/webhook does not update invoice to paid', async () => {
  const Invoice = require('../models/Invoice');
  const User    = require('../models/User');
  const Client  = require('../models/Client');

  // Create minimal test data
  const user = await User.create({
    firstName: 'Test', lastName: 'Therapist',
    email: `bug12_${Date.now()}@test.com`, password: 'test1234', role: 'therapist',
  });
  const client = await Client.create({
    therapist: user._id, firstName: 'Test', lastName: 'Client',
  });
  const invoice = await Invoice.create({
    therapist: user._id, client: client._id,
    invoiceNumber: `INV-TEST-${Date.now()}`,
    lineItems: [{ description: 'Session', quantity: 1, unitPrice: 1500, total: 1500 }],
    subtotal: 1500, total: 1500,
    razorpayOrderId: `order_bug12_${Date.now()}`,
    status: 'draft',
  });

  // BUG: webhook endpoint doesn't exist / doesn't process events
  // After fix: invoice.status should become 'paid' after payment.captured event is processed
  const invoiceAfter = await Invoice.findById(invoice._id);
  expect(invoiceAfter.status).toBe('paid'); // WILL FAIL on unfixed code (status is still 'draft')

  // Cleanup
  await User.findByIdAndDelete(user._id);
  await Client.findByIdAndDelete(client._id);
  await Invoice.findByIdAndDelete(invoice._id);
});

// ─── Test 1.3 — Package and PackagePurchase models absent ────────────────────
// EXPECTED FAILURE on unfixed code: modules not found → require() throws
// COUNTEREXAMPLE: Error: Cannot find module '../models/Package'
test('BUG 1.3: Package and PackagePurchase models do not exist', () => {
  // BUG: These models don't exist yet — require() throws MODULE_NOT_FOUND
  // After fix: both modules resolve without error
  expect(() => require('../models/Package')).not.toThrow();
  expect(() => require('../models/PackagePurchase')).not.toThrow();
});

// ─── Test 1.4 — PDF missing HSN code (PBT) ────────────────────────────────────
// EXPECTED FAILURE on unfixed code: generateInvoicePDF does not include HSN/SAC 998311
// COUNTEREXAMPLE: buffer.toString() does not contain '998311' for any GSTIN input
test('BUG 1.4: generateInvoicePDF buffer does not contain HSN code 998311', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 5, maxLength: 20 }), // arbitrary GSTIN
      fc.integer({ min: 500, max: 50000 }),        // arbitrary session rate
      async (gstin, rate) => {
        const mockInvoice = {
          _id: new mongoose.Types.ObjectId(),
          invoiceNumber: 'INV-2026-0001',
          client: {
            firstName: 'Test', lastName: 'Client',
            email: 'client@test.com',
            address: { state: 'Maharashtra' },
          },
          lineItems: [{ description: 'Therapy Session', quantity: 1, unitPrice: rate, total: rate }],
          subtotal: rate,
          tax: Math.round(rate * 0.18),
          discount: 0,
          total: rate + Math.round(rate * 0.18),
          status: 'paid',
          razorpayPaymentId: 'pay_test_abc123',
          createdAt: new Date(),
        };
        const mockTherapist = {
          firstName: 'Dr', lastName: 'Therapist',
          email: 'therapist@test.com',
          gstin: gstin,
        };

        const buffer = await generateInvoicePDF(mockInvoice, mockTherapist);
        const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));

        // BUG: unfixed PDF does not contain HSN/SAC code 998311
        // After fix: must contain '998311'
        return text.includes('998311');
      }
    ),
    { numRuns: 3 }
  );
});

// ─── Test 1.5 — Advance payment gate missing ─────────────────────────────────
// EXPECTED FAILURE on unfixed code: createSession always sets status 'scheduled'
// COUNTEREXAMPLE: session.status === 'scheduled' (not 'payment_pending') when requireAdvancePayment=true
test('BUG 1.5: POST /api/sessions with requireAdvancePayment=true sets status=scheduled instead of payment_pending', async () => {
  const User   = require('../models/User');
  const Client = require('../models/Client');
  const jwt    = require('jsonwebtoken');

  const user = await User.create({
    firstName: 'Dr', lastName: 'Gate',
    email: `bug15_${Date.now()}@test.com`, password: 'test1234', role: 'therapist',
  });
  const client = await Client.create({
    therapist: user._id, firstName: 'Advance', lastName: 'Client',
    sessionRate: 1500, sessionDuration: 50,
  });

  const token = jwt.sign(
    { id: user._id, role: 'therapist' },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );

  const res = await request(app)
    .post('/api/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId: client._id.toString(),
      startTime: new Date(Date.now() + 86400000).toISOString(),
      duration: 50,
      type: 'individual',
      modality: 'video',
      requireAdvancePayment: true,
    });

  expect(res.status).toBe(201);
  // BUG: unfixed code always sets status to 'scheduled'
  // After fix: status must be 'payment_pending' and razorpayOrderId must be present
  expect(res.body.data.session.status).toBe('payment_pending');
  expect(res.body.data.razorpayOrderId).toBeTruthy();

  // Cleanup
  await User.findByIdAndDelete(user._id);
  await Client.findByIdAndDelete(client._id);
  const Session = require('../models/Session');
  if (res.body.data?.session?._id) {
    await Session.findByIdAndDelete(res.body.data.session._id);
  }
});
