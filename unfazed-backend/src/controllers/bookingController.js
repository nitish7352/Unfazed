const crypto = require('crypto');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Session = require('../models/Session');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateInvoiceNumber, getRazorpay, RZP_KEY_ID, RZP_KEY_SECRET } = require('./invoiceController');
const { fireEvent } = require('../services/notificationService');

// @desc    Create a new appointment booking (client)
// @route   POST /api/bookings
// @access  Private (client or any authenticated user)
const createBooking = asyncHandler(async (req, res) => {
  const {
    therapistId,
    appointmentDate,
    startTime,
    duration = 50,
    sessionType = 'individual',
    mode = 'online',
    notes = '',
    message = '',
  } = req.body;

  if (!therapistId) return errorResponse(res, 'therapistId is required', 400);
  if (!startTime) return errorResponse(res, 'startTime is required', 400);

  // 1. Verify therapist exists and is active
  const therapist = await User.findOne({ _id: therapistId, role: 'therapist', isActive: true });
  if (!therapist) return errorResponse(res, 'Therapist not found or inactive', 404);

  const therapistProfile = await TherapistProfile.findOne({ user: therapistId });

  // 2. Calculate time range
  const start = new Date(startTime);
  const slotDuration = Number(duration) || therapistProfile?.defaultSessionDuration || 50;
  const end = new Date(start.getTime() + slotDuration * 60000);
  const apptDate = appointmentDate ? new Date(appointmentDate) : start;

  // 3. Double Booking Prevention (backend validation)
  const [existingSession, existingBooking] = await Promise.all([
    Session.findOne({
      therapist: therapistId,
      startTime: { $lt: end },
      endTime: { $gt: start },
      status: { $nin: ['cancelled', 'no_show'] },
    }),
    Booking.findOne({
      therapist: therapistId,
      startTime: { $lt: end },
      endTime: { $gt: start },
      status: { $nin: ['cancelled', 'rejected'] },
    }),
  ]);

  if (existingSession || existingBooking) {
    return errorResponse(
      res,
      'This time slot is no longer available. Please select another slot.',
      409
    );
  }

  // 4. Automatic Client-Therapist Association
  let clientRecord = await Client.findOne({
    therapist: therapistId,
    $or: [{ user: req.user._id }, { email: req.user.email }],
  });

  if (!clientRecord) {
    clientRecord = await Client.create({
      therapist: therapistId,
      user: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone || null,
      status: 'active',
      sessionRate: therapistProfile?.defaultSessionRate || 1200,
      sessionDuration: slotDuration,
    });

    // Update therapist client count
    await TherapistProfile.findOneAndUpdate(
      { user: therapistId },
      { $inc: { totalClients: 1 } }
    );
  } else if (!clientRecord.user) {
    clientRecord.user = req.user._id;
    if (req.user.phone && !clientRecord.phone) clientRecord.phone = req.user.phone;
    await clientRecord.save();
  }

  // 5. Calculate session fee
  const fee = clientRecord.sessionRate || therapistProfile?.defaultSessionRate || 1200;

  // 6. Automatically generate Invoice
  const invoiceNumber = await generateInvoiceNumber(therapistId);
  const sessionTypeDisplay = sessionType.charAt(0).toUpperCase() + sessionType.slice(1);
  const formattedDate = start.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const invoice = await Invoice.create({
    therapist: therapistId,
    client: clientRecord._id,
    clientUser: req.user._id,
    invoiceNumber,
    lineItems: [
      {
        description: `${sessionTypeDisplay} Therapy Session - ${formattedDate}`,
        quantity: 1,
        unitPrice: fee,
        total: fee,
      },
    ],
    subtotal: fee,
    tax: 0,
    discount: 0,
    total: fee,
    currency: 'INR',
    status: 'sent',
    dueDate: start,
    notes: `Appointment on ${formattedDate}.`,
  });

  // 7. Create Session
  const roomId = crypto.randomBytes(8).toString('hex');
  const session = await Session.create({
    therapist: therapistId,
    client: clientRecord._id,
    clientUser: req.user._id,
    invoiceId: invoice._id,
    startTime: start,
    endTime: end,
    duration: slotDuration,
    type: sessionType,
    modality: mode === 'in_person' ? 'in_person' : 'video',
    rate: fee,
    status: 'scheduled',
    roomId,
    joinLink: `/session/room/${roomId}`,
    paymentStatus: 'pending',
  });

  // 8. Create Booking
  const booking = await Booking.create({
    client: clientRecord._id,
    clientUser: req.user._id,
    therapist: therapistId,
    session: session._id,
    invoice: invoice._id,
    appointmentDate: apptDate,
    startTime: start,
    endTime: end,
    duration: slotDuration,
    sessionType,
    mode,
    fee,
    status: 'pending', // pending confirmation by therapist or automatic
    paymentStatus: 'unpaid',
    notes: notes || message || '',
  });

  // Link invoice & session to booking
  invoice.booking = booking._id;
  invoice.session = session._id;
  await invoice.save();

  session.booking = booking._id;
  await session.save();

  // 9. Real-time Notifications & Socket.IO
  const io = req.app.get('io');
  const notificationTitle = 'New Booking Request';
  const notificationMsg = `New ${sessionType} session booked by ${req.user.firstName} ${req.user.lastName} for ${formattedDate}.`;

  const notification = await Notification.create({
    recipient: therapistId,
    type: 'new_booking',
    title: notificationTitle,
    message: notificationMsg,
    relatedSession: session._id,
    relatedClient: clientRecord._id,
    relatedInvoice: invoice._id,
    relatedBooking: booking._id,
  });

  if (io) {
    io.to(`user:${therapistId.toString()}`).emit('notification', {
      _id: notification._id,
      type: 'new_booking',
      title: notificationTitle,
      message: notificationMsg,
      isRead: false,
      createdAt: notification.createdAt,
    });
    io.to(`user:${therapistId.toString()}`).emit('new_booking_request', {
      booking: {
        ...booking.toObject(),
        client: clientRecord,
        clientUser: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          avatar: req.user.avatar,
        },
      },
    });
  }

  // Populate response
  await booking.populate([
    { path: 'therapist', select: 'firstName lastName email avatar phone' },
    { path: 'client', select: 'firstName lastName email phone' },
    { path: 'invoice', select: 'invoiceNumber total status dueDate' },
    { path: 'session', select: 'startTime endTime duration modality roomId joinLink status' },
  ]);

  return successResponse(
    res,
    {
      booking,
      invoice,
      session,
      client: clientRecord,
    },
    'Appointment booked successfully',
    201
  );
});

// @desc    Get current client's bookings
// @route   GET /api/bookings/my
// @access  Private (client)
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ clientUser: req.user._id })
    .populate('therapist', 'firstName lastName email avatar phone')
    .populate('invoice', 'invoiceNumber total status dueDate paidAt razorpayOrderId')
    .populate('session', 'startTime endTime duration modality roomId joinLink status')
    .sort({ startTime: -1 });

  return successResponse(res, { bookings, count: bookings.length });
});

// @desc    Get therapist's bookings
// @route   GET /api/bookings/therapist
// @access  Private (therapist)
const getTherapistBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { therapist: req.user._id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('clientUser', 'firstName lastName email avatar phone')
    .populate('client', 'firstName lastName email phone totalSessions totalAmountPaid')
    .populate('invoice', 'invoiceNumber total status dueDate paidAt')
    .populate('session', 'startTime endTime duration modality roomId joinLink status')
    .sort({ startTime: -1 });

  return successResponse(res, { bookings, count: bookings.length });
});

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private (owner therapist or client)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('therapist', 'firstName lastName email avatar phone')
    .populate('clientUser', 'firstName lastName email avatar phone')
    .populate('client', 'firstName lastName email phone')
    .populate('invoice')
    .populate('session');

  if (!booking) return errorResponse(res, 'Booking not found', 404);

  // Security: only therapist, clientUser, or admin
  const isTherapist = booking.therapist?._id?.toString() === req.user._id.toString();
  const isClient = booking.clientUser?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isTherapist && !isClient && !isAdmin) {
    return errorResponse(res, 'Not authorized to view this booking', 403);
  }

  return successResponse(res, { booking });
});

// @desc    Update booking status (accept, reject, cancel)
// @route   PATCH /api/bookings/:id/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!status) return errorResponse(res, 'status is required', 400);

  const booking = await Booking.findById(req.params.id)
    .populate('therapist', 'firstName lastName email')
    .populate('clientUser', 'firstName lastName email')
    .populate('client', 'firstName lastName email')
    .populate('session')
    .populate('invoice');

  if (!booking) return errorResponse(res, 'Booking not found', 404);

  const isTherapist = booking.therapist?._id?.toString() === req.user._id.toString();
  const isClient = booking.clientUser?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isTherapist && !isClient && !isAdmin) {
    return errorResponse(res, 'Not authorized to update this booking', 403);
  }

  const io = req.app.get('io');

  if (status === 'confirmed') {
    if (!isTherapist && !isAdmin) {
      return errorResponse(res, 'Only the therapist can confirm a booking', 403);
    }
    booking.status = 'confirmed';
    if (booking.session) {
      await Session.findByIdAndUpdate(booking.session._id, { status: 'confirmed' });
    }

    // In-app notification to client
    const title = 'Booking Confirmed';
    const message = `Dr. ${booking.therapist?.firstName} confirmed your appointment for ${new Date(booking.startTime).toLocaleString('en-IN')}.`;
    await Notification.create({
      recipient: booking.clientUser._id,
      type: 'booking_confirmed',
      title,
      message,
      relatedBooking: booking._id,
      relatedSession: booking.session?._id,
    });

    if (io) {
      io.to(`user:${booking.clientUser._id.toString()}`).emit('notification', {
        type: 'booking_confirmed',
        title,
        message,
        isRead: false,
        createdAt: new Date(),
      });
      io.to(`user:${booking.clientUser._id.toString()}`).emit('booking_updated', { booking });
    }
  } else if (status === 'rejected') {
    if (!isTherapist && !isAdmin) {
      return errorResponse(res, 'Only the therapist can reject a booking', 403);
    }
    booking.status = 'rejected';
    booking.rejectionReason = reason || 'Therapist is unavailable';

    if (booking.session) {
      await Session.findByIdAndUpdate(booking.session._id, { status: 'cancelled', cancellationReason: reason });
    }
    if (booking.invoice && booking.invoice.status !== 'paid') {
      await Invoice.findByIdAndUpdate(booking.invoice._id, { status: 'cancelled' });
    }

    // Notification to client
    const title = 'Booking Request Declined';
    const message = `Dr. ${booking.therapist?.firstName} was unable to accept your booking for ${new Date(booking.startTime).toLocaleString('en-IN')}.${reason ? ' Reason: ' + reason : ''}`;
    await Notification.create({
      recipient: booking.clientUser._id,
      type: 'booking_rejected',
      title,
      message,
      relatedBooking: booking._id,
    });

    if (io) {
      io.to(`user:${booking.clientUser._id.toString()}`).emit('notification', {
        type: 'booking_rejected',
        title,
        message,
        isRead: false,
        createdAt: new Date(),
      });
      io.to(`user:${booking.clientUser._id.toString()}`).emit('booking_updated', { booking });
    }
  } else if (status === 'cancelled') {
    booking.status = 'cancelled';
    booking.cancelledBy = isTherapist ? 'therapist' : 'client';
    booking.cancellationReason = reason || '';

    if (booking.session) {
      await Session.findByIdAndUpdate(booking.session._id, {
        status: 'cancelled',
        cancelledBy: booking.cancelledBy,
        cancellationReason: reason,
        cancelledAt: new Date(),
      });
    }
    if (booking.invoice && booking.invoice.status !== 'paid') {
      await Invoice.findByIdAndUpdate(booking.invoice._id, { status: 'cancelled' });
    }

    const notifyRecipient = isTherapist ? booking.clientUser._id : booking.therapist._id;
    const title = 'Booking Cancelled';
    const message = `The session scheduled for ${new Date(booking.startTime).toLocaleString('en-IN')} has been cancelled.`;

    await Notification.create({
      recipient: notifyRecipient,
      type: 'session_cancelled',
      title,
      message,
      relatedBooking: booking._id,
    });

    if (io) {
      io.to(`user:${notifyRecipient.toString()}`).emit('notification', {
        type: 'session_cancelled',
        title,
        message,
        isRead: false,
        createdAt: new Date(),
      });
      io.to(`user:${notifyRecipient.toString()}`).emit('booking_updated', { booking });
    }
  }

  await booking.save();
  return successResponse(res, { booking }, `Booking marked as ${status}`);
});

// @desc    Create Razorpay Order for Booking
// @route   POST /api/bookings/:id/pay
// @access  Private (client or therapist)
const createBookingRazorpayOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('invoice');
  if (!booking) return errorResponse(res, 'Booking not found', 404);

  const isTherapist = booking.therapist?.toString() === req.user._id.toString();
  const isClient = booking.clientUser?.toString() === req.user._id.toString();
  if (!isTherapist && !isClient && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (booking.paymentStatus === 'paid') {
    return errorResponse(res, 'Booking is already paid', 400);
  }

  const invoice = booking.invoice;
  if (!invoice) return errorResponse(res, 'Invoice not found for this booking', 404);

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(booking.fee * 100), // in paise
    currency: booking.currency || 'INR',
    receipt: invoice.invoiceNumber,
    notes: {
      bookingId: booking._id.toString(),
      invoiceId: invoice._id.toString(),
      therapistId: booking.therapist.toString(),
      clientUserId: booking.clientUser.toString(),
    },
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  invoice.razorpayOrderId = order.id;
  await invoice.save();

  return successResponse(res, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RZP_KEY_ID,
    bookingId: booking._id,
    invoiceId: invoice._id,
  });
});

// @desc    Verify Razorpay payment for Booking
// @route   POST /api/bookings/:id/verify-payment
// @access  Private (client or therapist)
const verifyBookingPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const booking = await Booking.findById(req.params.id).populate('invoice client therapist clientUser');
  if (!booking) return errorResponse(res, 'Booking not found', 404);

  const isTherapist = booking.therapist?._id?.toString() === req.user._id.toString();
  const isClient = booking.clientUser?._id?.toString() === req.user._id.toString();
  if (!isTherapist && !isClient && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized', 403);
  }

  const expectedSignature = crypto
    .createHmac('sha256', RZP_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return errorResponse(res, 'Payment verification failed: invalid signature', 400);
  }

  // Update Booking
  booking.paymentStatus = 'paid';
  booking.status = 'confirmed'; // payment automatically confirms the booking
  booking.razorpayPaymentId = razorpay_payment_id;
  await booking.save();

  // Update Invoice
  if (booking.invoice) {
    booking.invoice.status = 'paid';
    booking.invoice.paidAt = new Date();
    booking.invoice.paidAmount = booking.fee;
    booking.invoice.razorpayPaymentId = razorpay_payment_id;
    await booking.invoice.save();
  }

  // Update Session
  if (booking.session) {
    await Session.findByIdAndUpdate(booking.session, {
      paymentStatus: 'paid',
      status: 'confirmed',
    });
  }

  // Update Client totalAmountPaid
  if (booking.client) {
    await Client.findByIdAndUpdate(booking.client._id, {
      $inc: { totalAmountPaid: booking.fee },
    });
  }

  // Real-time notification & Socket.io
  const io = req.app.get('io');
  const notifTitle = 'Payment Received';
  const notifMsg = `Payment of ₹${booking.fee} received from ${booking.clientUser?.firstName} for session on ${new Date(booking.startTime).toLocaleDateString('en-IN')}.`;

  await Notification.create({
    recipient: booking.therapist._id,
    type: 'invoice_paid',
    title: notifTitle,
    message: notifMsg,
    relatedBooking: booking._id,
    relatedInvoice: booking.invoice?._id,
  });

  if (io) {
    io.to(`user:${booking.therapist._id.toString()}`).emit('notification', {
      type: 'invoice_paid',
      title: notifTitle,
      message: notifMsg,
      isRead: false,
      createdAt: new Date(),
    });
    io.to(`user:${booking.therapist._id.toString()}`).emit('booking_updated', { booking });
  }

  return successResponse(res, { booking, invoice: booking.invoice }, 'Payment verified and booking confirmed');
});

module.exports = {
  createBooking,
  getMyBookings,
  getTherapistBookings,
  getBookingById,
  updateBookingStatus,
  createBookingRazorpayOrder,
  verifyBookingPayment,
};
