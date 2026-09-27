const express = require('express');
const router = express.Router();
const {
  getSessions, getUpcomingSessions, getSession,
  createSession, updateSession, cancelSession,
  completeSession, deleteSession,
} = require('../controllers/sessionController');
const { createRecurringSessions, cancelRecurringGroup } = require('../services/recurringService');
const asyncHandler  = require('../utils/asyncHandler');
const Client        = require('../models/Client');
const TherapistProfile = require('../models/TherapistProfile');
const crypto        = require('crypto');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/upcoming', getUpcomingSessions);
router.route('/').get(getSessions).post(createSession);
router.route('/:id').get(getSession).put(updateSession).delete(deleteSession);
router.put('/:id/cancel',   cancelSession);
router.put('/:id/complete', completeSession);

// ── Recurring sessions ────────────────────────────────────────────────────────
router.post('/recurring', asyncHandler(async (req, res) => {
  const { clientId, startTime, duration, type, modality, rate, frequency, count } = req.body;

  const client = await Client.findOne({ _id: clientId, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);

  let sessionRate = rate;
  if (!sessionRate) {
    const profile = await TherapistProfile.findOne({ user: req.user._id });
    sessionRate = client.sessionRate || profile?.defaultSessionRate || 0;
  }

  const sessions = await createRecurringSessions(
    {
      therapist: req.user._id,
      client:    clientId,
      startTime,
      duration:  Number(duration) || 50,
      type:      type || 'individual',
      modality:  modality || 'video',
      rate:      sessionRate,
      timezone:  req.user.timezone || 'Asia/Kolkata',
    },
    frequency || 'weekly',
    Number(count) || 8
  );

  return successResponse(res, { sessions, count: sessions.length }, `${sessions.length} recurring sessions created`, 201);
}));

// Cancel all future sessions in a recurring group
router.put('/recurring/:groupId/cancel', asyncHandler(async (req, res) => {
  const result = await cancelRecurringGroup(req.params.groupId, req.user._id);
  return successResponse(res, { modified: result.modifiedCount }, 'Recurring series cancelled');
}));

module.exports = router;
