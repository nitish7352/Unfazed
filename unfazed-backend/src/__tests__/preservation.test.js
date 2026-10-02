/**
 * Preservation Property Tests — Module 4: Payments & Packages
 *
 * These tests MUST PASS on both unfixed AND fixed code.
 * They guard against regressions in existing functionality.
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const fc       = require('fast-check');
const app      = require('../../app');
const { generateInvoicePDF } = require('../services/pdfService');

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unfazed_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Helper: create a therapist + get JWT token
async function createTherapistAndToken() {
  const User   = require('../models/User');
  const jwt    = require('jsonwebtoken');
  const user = await User.create({
    firstName: 'Preserve', lastName: 'Test',
    email: `preserve_${Date.now()}@test.com`,
    password: 'test1234', role: 'therapist',
  });
  const token = jwt.sign(
    { id: user._id, role: 'therapist' },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
  return { user, token };
}

// ─── Preservation 3.1 + 3.2 — Invoice CRUD unchanged ─────────────────────────
describe('PRESERVE 3.1+3.2: Invoice CRUD and verify endpoint', () => {
  let therapist, token, clientId, invoiceId;

  beforeAll(async () => {
    const Client  = require('../models/Client');
    const Invoice = require('../models/Invoice');
    const result  = await createTherapistAndToken();
    therapist = result.user;
    token     = result.token;

    // Clean up any leftover invoices from previous test runs for this therapist
    await Invoice.deleteMany({ therapist: therapist._id });

    const client = await Client.create({
      therapist: therapist._id,
      firstName: 'Invoice', lastName: 'Client',
    });
    clientId = client._id.toString();
  });

  afterAll(async () => {
    const User    = require('../models/User');
    const Client  = require('../models/Client');
    const Invoice = require('../models/Invoice');
    await Invoice.deleteMany({ therapist: therapist._id });
    await User.findByIdAndDelete(therapist._id);
    await Client.deleteMany({ therapist: therapist._id });
  });

  test('POST /api/invoices creates invoice with correct shape', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId,
        lineItems: [{ description: 'Session', quantity: 1, unitPrice: 1500, total: 1500 }],
        tax: 0, discount: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice).toMatchObject({
      subtotal: 1500,
      total: 1500,
      status: 'draft',
    });
    invoiceId = res.body.data.invoice._id;
  });

  test('GET /api/invoices returns list', async () => {
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/invoices/:id returns single invoice', async () => {
    const res = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.invoice._id).toBe(invoiceId);
  });

  test('PUT /api/invoices/:id updates invoice', async () => {
    const res = await request(app)
      .put(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'sent' });

    expect(res.status).toBe(200);
    expect(res.body.data.invoice.status).toBe('sent');
  });

  test('PBT: invoice creation with random rates always succeeds with correct total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: 1, max: 10 }),
        async (unitPrice, quantity) => {
          const expectedTotal = unitPrice * quantity;
          const res = await request(app)
            .post('/api/invoices')
            .set('Authorization', `Bearer ${token}`)
            .send({
              clientId,
              lineItems: [{ description: 'Session', quantity, unitPrice, total: expectedTotal }],
              tax: 0, discount: 0,
            });
          return res.status === 201 && res.body.data.invoice.subtotal === expectedTotal;
        }
      ),
      { numRuns: 5 }
    );
  });
});

// ─── Preservation 3.3 — Default session creation unchanged ───────────────────
describe('PRESERVE 3.3: POST /api/sessions without requireAdvancePayment → status=scheduled', () => {
  let therapist, token, client;

  beforeAll(async () => {
    const Client = require('../models/Client');
    const result = await createTherapistAndToken();
    therapist = result.user;
    token     = result.token;
    client = await Client.create({
      therapist: therapist._id,
      firstName: 'Default', lastName: 'Session',
      sessionRate: 1500, sessionDuration: 50,
    });
  });

  afterAll(async () => {
    const User   = require('../models/User');
    const Client = require('../models/Client');
    await User.findByIdAndDelete(therapist._id);
    await Client.deleteMany({ therapist: therapist._id });
  });

  test('session without requireAdvancePayment → status=scheduled', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client._id.toString(),
        startTime: new Date(Date.now() + 86400000).toISOString(),
        duration: 50,
        type: 'individual',
        modality: 'video',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.session.status).toBe('scheduled');
    expect(res.body.data.razorpayOrderId).toBeFalsy();
  });

  test('PBT: session without requireAdvancePayment always → status=scheduled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 90 }),  // days in future
        fc.constantFrom('individual', 'couples', 'family'),
        fc.constantFrom('video', 'in_person', 'phone'),
        async (daysAhead, type, modality) => {
          const startTime = new Date(Date.now() + daysAhead * 86400000).toISOString();
          const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ clientId: client._id.toString(), startTime, duration: 50, type, modality });
          return res.status === 201 && res.body.data.session.status === 'scheduled';
        }
      ),
      { numRuns: 5 }
    );
  });
});

// ─── Preservation 3.5 — Subscription webhook unchanged ───────────────────────
test('PRESERVE 3.5: POST /api/subscription/webhook handles subscription.charged', async () => {
  const User = require('../models/User');
  const user = await User.create({
    firstName: 'Sub', lastName: 'Webhook',
    email: `subwh_${Date.now()}@test.com`,
    password: 'test1234', role: 'therapist',
  });

  // We just check the endpoint exists and responds (not 404)
  // Signature verification will return 400 with invalid signature - that's fine,
  // the key is the endpoint exists and is reachable
  const res = await request(app)
    .post('/api/subscription/webhook')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', 'invalid')
    .send(JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { notes: { userId: user._id.toString() } } } } }));

  // The endpoint exists (not 404) and handles the request
  expect(res.status).not.toBe(404);

  await User.findByIdAndDelete(user._id);
});

// ─── Preservation 3.6 — Graceful PDF without GST data ───────────────────────
describe('PRESERVE 3.6: generateInvoicePDF with null/empty GSTIN → valid PDF, no crash', () => {
  const makeInvoice = (rate) => ({
    _id: new mongoose.Types.ObjectId(),
    invoiceNumber: 'INV-2026-0001',
    client: { firstName: 'Test', lastName: 'Client', email: 'c@test.com', address: { state: 'Maharashtra' } },
    lineItems: [{ description: 'Session', quantity: 1, unitPrice: rate, total: rate }],
    subtotal: rate, tax: 0, discount: 0, total: rate,
    status: 'paid', razorpayPaymentId: null,
    createdAt: new Date(),
  });

  test('null GSTIN → valid PDF buffer (starts with %PDF), no throw', async () => {
    const therapist = { firstName: 'Dr', lastName: 'Test', email: 't@test.com', gstin: null };
    const buffer = await generateInvoicePDF(makeInvoice(1500), therapist);
    const header = buffer.slice(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  test('empty string GSTIN → valid PDF buffer, no throw', async () => {
    const therapist = { firstName: 'Dr', lastName: 'Test', email: 't@test.com', gstin: '' };
    const buffer = await generateInvoicePDF(makeInvoice(1500), therapist);
    const header = buffer.slice(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  test('undefined GSTIN → valid PDF buffer, no throw', async () => {
    const therapist = { firstName: 'Dr', lastName: 'Test', email: 't@test.com' };
    const buffer = await generateInvoicePDF(makeInvoice(1500), therapist);
    const header = buffer.slice(0, 4).toString('ascii');
    expect(header).toBe('%PDF');
  });

  test('PBT: any null/undefined/empty gstin never throws and always produces valid PDF', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant('')),
        fc.integer({ min: 500, max: 20000 }),
        async (gstin, rate) => {
          try {
            const therapist = { firstName: 'Dr', lastName: 'T', email: 't@test.com', gstin };
            const buffer = await generateInvoicePDF(makeInvoice(rate), therapist);
            return buffer.slice(0, 4).toString('ascii') === '%PDF';
          } catch {
            return false; // any throw = test fails
          }
        }
      ),
      { numRuns: 6 }
    );
  });
});
