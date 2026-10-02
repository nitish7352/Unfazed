const Session          = require('../models/Session');
const Client           = require('../models/Client');
const User             = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const asyncHandler     = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { fireEvent }    = require('../services/notificationService');
const crypto           = require('crypto');

// @desc    Get all sessions for therapist
// @route   GET /api/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, startDate, endDate, clientId } = req.query;
  const skip = (page - 1) * limit;

  const query = { therapist: req.user._id };
  if (status)   query.status   = status;
  if (clientId) query.client   = clientId;
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate)   query.startTime.$lte = new Date(endDate);
  }

  const [sessions, total] = await Promise.all([
    Session.find(query)
      .populate('client', 'firstName lastName email avatar')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Session.countDocuments(query),
  ]);

  return paginatedResponse(res, sessions, total, page, limit);
});

// @desc    Get upcoming sessions (next 7 days)
// @route   GET /api/sessions/upcoming
// @access  Private
const getUpcomingSessions = asyncHandler(async (req, res) => {
  const now      = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const sessions = await Session.find({
    therapist: req.user._id,
    startTime: { $gte: now, $lte: nextWeek },
    status:    { $in: ['scheduled', 'confirmed'] },
  })
    .populate('client', 'firstName lastName email avatar')
    .sort({ startTime: 1 })
    .limit(20);

  return successResponse(res, { sessions });
});

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, therapist: req.user._id })
    .populate('client', 'firstName lastName email avatar phone sessionRate sessionDuration')
    .populate('noteId');

  if (!session) return errorResponse(res, 'Session not found', 404);
  return successResponse(res, { session });
});

// @desc    Create session
// @route   POST /api/sessions
// @access  Private
const createSession = asyncHandler(async (req, res) => {
  const { clientId, startTime, duration, type, modality, rate } = req.body;

  const client = await Client.findOne({ _id: clientId, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);

  // Resolve session rate
  let sessionRate = rate;
  if (!sessionRate) {
    if (client.sessionRate) {
      sessionRate = client.sessionRate;
    } else {
      const profile = await TherapistProfile.findOne({ user: req.user._id });
      sessionRate = profile ? profile.defaultSessionRate : 0;
    }
  }

  const sessionDuration = duration || client.sessionDuration || 50;
  const start  = new Date(startTime);
  const end    = new Date(start.getTime() + sessionDuration * 60 * 1000);
  const roomId = crypto.randomBytes(8).toString('hex');

  const session = await Session.create({
    therapist: req.user._id,
    client:    clientId,
    startTime: start,
    endTime:   end,
    duration:  sessionDuration,
    type:      type     || 'individual',
    modality:  modality || 'video',
    rate:      sessionRate,
    roomId,
    joinLink:  `/session/room/${roomId}`,
    status:    'scheduled',
  });

  await session.populate('client', 'firstName lastName email avatar');

  // ── Fire booking_confirmed notification ──────────────────────────────────
  const therapist = await User.findById(req.user._id).select('firstName lastName email');
  const io        = req.app.get('io');
  fireEvent('booking_confirmed', {
    therapist,
    client:  session.client,
    session,
    io,
  }).catch(() => {}); // non-fatal

  return successResponse(res, { session }, 'Session scheduled', 201);
});

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
const updateSession = asyncHandler(async (req, res) => {
  const allowedFields = [
    'startTime', 'endTime', 'duration', 'type', 'modality',
    'status', 'rate', 'paymentStatus', 'cancelledBy', 'cancellationReason', 'cancelledAt',
  ];

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (updates.startTime && updates.duration) {
    updates.endTime = new Date(new Date(updates.startTime).getTime() + updates.duration * 60 * 1000);
  }

  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('client', 'firstName lastName email avatar');

  if (!session) return errorResponse(res, 'Session not found', 404);
  return successResponse(res, { session }, 'Session updated');
});

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
const cancelSession = asyncHandler(async (req, res) => {
  const { reason, cancelledBy = 'therapist' } = req.body;

  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    {
      status:             'cancelled',
      cancelledBy,
      cancellationReason: reason || '',
      cancelledAt:        new Date(),
    },
    { new: true }
  ).populate('client', 'firstName lastName email avatar');

  if (!session) return errorResponse(res, 'Session not found', 404);

  // ── Fire session_cancelled notification ──────────────────────────────────
  const therapist = await User.findById(req.user._id).select('firstName lastName email');
  const io        = req.app.get('io');
  fireEvent('session_cancelled', {
    therapist,
    client:  session.client,
    session,
    io,
  }).catch(() => {}); // non-fatal

  return successResponse(res, { session }, 'Session cancelled');
});

// @desc    Complete session
// @route   PUT /api/sessions/:id/complete
// @access  Private
const completeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    { status: 'completed' },
    { new: true }
  ).populate('client', 'firstName lastName email avatar');

  if (!session) return errorResponse(res, 'Session not found', 404);

  // Increment client session count
  await Client.findByIdAndUpdate(session.client, { $inc: { totalSessions: 1 } });

  return successResponse(res, { session }, 'Session marked as completed');
});

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findOneAndDelete({ _id: req.params.id, therapist: req.user._id });
  if (!session) return errorResponse(res, 'Session not found', 404);
  return successResponse(res, {}, 'Session deleted');
});

module.exports = {
  getSessions, getUpcomingSessions, getSession,
  createSession, updateSession, cancelSession,
  completeSession, deleteSession,
};
