const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');

const User = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const ClientProfile = require('../models/ClientProfile');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const Invoice = require('../models/Invoice');
const Availability = require('../models/Availability');

describe('Therapist Discovery & Booking System End-to-End', () => {
  let therapistUser, therapistToken, therapistId;
  let clientUser, clientToken, clientId;
  let createdBookingId;
  let chosenSlotStart;
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 2); // 2 days in the future
  const dateStr = testDate.toISOString().split('T')[0];

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unfazed_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    }

    // 1. Create a public therapist
    therapistUser = await User.create({
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: `dr_ananya_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'therapist',
      phone: '+919876543210',
    });
    therapistId = therapistUser._id.toString();

    therapistToken = jwt.sign(
      { id: therapistUser._id, role: 'therapist' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Setup therapist profile with discovery fields
    await TherapistProfile.create({
      user: therapistUser._id,
      title: 'Senior Clinical Psychologist',
      qualification: 'M.Phil Clinical Psychology, RCI Licensed',
      bio: 'Specialist in Cognitive Behavioral Therapy and Anxiety disorders.',
      specializations: ['CBT', 'Anxiety', 'Depression'],
      yearsExperience: 8,
      defaultSessionRate: 1500,
      defaultSessionDuration: 50,
      languages: ['English', 'Hindi'],
      sessionTypes: ['individual', 'couples'],
      modes: ['video', 'in_person', 'online'],
      isPublic: true,
      isApproved: true,
      rating: 4.9,
      reviewCount: 24,
      workingHours: [
        {
          day: testDate.getDay(),
          enabled: true,
          start: '09:00',
          end: '17:00',
        },
      ],
    });

    // Setup availability
    await Availability.create({
      therapist: therapistUser._id,
      weekly: [
        {
          day: testDate.getDay(),
          enabled: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
      ],
      defaultDuration: 50,
      bufferTime: 10,
    });
  });

  afterAll(async () => {
    if (therapistUser) {
      await User.findByIdAndDelete(therapistUser._id);
      await TherapistProfile.deleteMany({ user: therapistUser._id });
      await Availability.deleteMany({ therapist: therapistUser._id });
      await Client.deleteMany({ therapist: therapistUser._id });
      await Booking.deleteMany({ therapist: therapistUser._id });
      await Session.deleteMany({ therapist: therapistUser._id });
      await Invoice.deleteMany({ therapist: therapistUser._id });
    }
    if (clientUser) {
      await User.findByIdAndDelete(clientUser._id);
      await ClientProfile.deleteMany({ user: clientUser._id });
    }
    await mongoose.disconnect();
  });

  test('1. GET /api/therapists - public directory returns public therapists with filter', async () => {
    const res = await request(app)
      .get('/api/therapists')
      .query({ search: 'Ananya' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.therapists)).toBe(true);

    const found = res.body.data.therapists.find((t) => t._id.toString() === therapistId);
    expect(found).toBeDefined();
    expect(found.firstName).toBe('Ananya');
    expect(found.title).toBe('Senior Clinical Psychologist');
    expect(found.sessionFee).toBe(1500);
  });

  test('2. GET /api/therapists/:id - returns public therapist details', async () => {
    const res = await request(app).get(`/api/therapists/${therapistId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.therapist).toBeDefined();
    expect(res.body.data.therapist._id.toString()).toBe(therapistId);
    expect(res.body.data.therapist.qualification).toContain('RCI Licensed');
  });

  test('3. GET /api/therapists/:id/slots - returns open slots for date', async () => {
    const res = await request(app)
      .get(`/api/therapists/${therapistId}/slots`)
      .query({ date: dateStr });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.date).toBe(dateStr);
    expect(Array.isArray(res.body.data.slots)).toBe(true);
    expect(res.body.data.slots.length).toBeGreaterThan(0);

    chosenSlotStart = res.body.data.slots[0].start;
    expect(chosenSlotStart).toBeDefined();
  });

  test('4. POST /api/auth/register with role="client" creates client user and ClientProfile', async () => {
    const clientEmail = `client_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Rohan',
        lastName: 'Verma',
        email: clientEmail,
        password: 'Password123!',
        phone: '+919988776655',
        role: 'client',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('client');
    expect(res.body.data.token).toBeDefined();

    clientUser = res.body.data.user;
    clientToken = res.body.data.token;
    clientId = clientUser._id;

    // Verify ClientProfile exists
    const profile = await ClientProfile.findOne({ user: clientUser._id });
    expect(profile).not.toBeNull();
  });

  test('5. POST /api/bookings - client creates a booking, automatically creates Client, Session, and Invoice', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        therapistId,
        appointmentDate: dateStr,
        startTime: chosenSlotStart,
        duration: 50,
        sessionType: 'individual',
        mode: 'video',
        notes: 'Initial consultation for anxiety',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking).toBeDefined();

    const booking = res.body.data.booking;
    createdBookingId = booking._id;
    expect(booking.status).toBe('pending');
    expect(booking.fee).toBe(1500);

    // Verify associated Client relationship was created for the therapist
    const therapistClient = await Client.findOne({
      therapist: therapistUser._id,
      user: clientUser._id,
    });
    expect(therapistClient).not.toBeNull();
    expect(therapistClient.firstName).toBe('Rohan');

    // Verify invoice was created
    const invoice = await Invoice.findOne({ booking: createdBookingId });
    expect(invoice).not.toBeNull();
    expect(invoice.total).toBe(1500);

    // Verify session was created
    const session = await Session.findOne({ booking: createdBookingId });
    expect(session).not.toBeNull();
    expect(session.type).toBe('individual');
  });

  test('6. POST /api/bookings - prevents double-booking of same slot (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        therapistId,
        appointmentDate: dateStr,
        startTime: chosenSlotStart,
        duration: 50,
        sessionType: 'individual',
        mode: 'video',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('no longer available');
  });

  test('7. GET /api/therapists/:id/slots - booked slot is removed from available slots', async () => {
    const res = await request(app)
      .get(`/api/therapists/${therapistId}/slots`)
      .query({ date: dateStr });

    expect(res.status).toBe(200);
    const starts = res.body.data.slots.map((s) => s.start);
    expect(starts).not.toContain(chosenSlotStart);
  });

  test('8. GET /api/bookings/therapist - therapist views pending booking requests', async () => {
    const res = await request(app)
      .get('/api/bookings/therapist')
      .set('Authorization', `Bearer ${therapistToken}`)
      .query({ status: 'pending' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookings.length).toBeGreaterThan(0);

    const match = res.body.data.bookings.find((b) => b._id.toString() === createdBookingId.toString());
    expect(match).toBeDefined();
  });

  test('9. PATCH /api/bookings/:id/status - therapist accepts (confirms) the booking', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/status`)
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.status).toBe('confirmed');

    // Check session status updated
    const session = await Session.findOne({ booking: createdBookingId });
    expect(session.status).toBe('confirmed');
  });

  test('10. GET /api/bookings/my - client sees their confirmed appointment', async () => {
    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookings.length).toBeGreaterThan(0);

    const match = res.body.data.bookings.find((b) => b._id.toString() === createdBookingId.toString());
    expect(match).toBeDefined();
    expect(match.status).toBe('confirmed');
    expect(match.therapist.firstName).toBe('Ananya');
  });

  test('11. GET /api/clients - therapist client list includes the newly associated client', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const clientList = res.body.data.clients || res.body.data;
    const match = clientList.find((c) => c.firstName === 'Rohan' && c.lastName === 'Verma');
    expect(match).toBeDefined();
  });
});
