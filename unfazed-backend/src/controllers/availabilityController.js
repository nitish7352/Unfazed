const TherapistProfile = require('../models/TherapistProfile');
const Session          = require('../models/Session');
const asyncHandler     = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc  Get working hours
// @route GET /api/availability
const getAvailability = asyncHandler(async (req, res) => {
  const profile = await TherapistProfile.findOne({ user: req.user._id });
  if (!profile) return errorResponse(res, 'Profile not found', 404);
  return successResponse(res, { workingHours: profile.workingHours, timezone: profile.timezone });
});

// @desc  Update working hours
// @route PUT /api/availability
const updateAvailability = asyncHandler(async (req, res) => {
  const { workingHours, timezone } = req.body;
  const profile = await TherapistProfile.findOneAndUpdate(
    { user: req.user._id },
    { ...(workingHours && { workingHours }), ...(timezone && { timezone }) },
    { new: true, runValidators: true }
  );
  if (!profile) return errorResponse(res, 'Profile not found', 404);
  return successResponse(res, { workingHours: profile.workingHours, timezone: profile.timezone }, 'Availability updated');
});

// @desc  Get available time slots for a given date
// @route GET /api/availability/slots?date=YYYY-MM-DD&duration=50
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date, duration = 50 } = req.query;
  if (!date) return errorResponse(res, 'date query param required', 400);

  const profile = await TherapistProfile.findOne({ user: req.user._id });
  if (!profile) return errorResponse(res, 'Profile not found', 404);

  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun … 6=Sat

  const dayConfig = (profile.workingHours || []).find((wh) => wh.day === dayOfWeek);
  if (!dayConfig || !dayConfig.enabled) {
    return successResponse(res, { slots: [], reason: 'Not a working day' });
  }

  // Build all possible slots from start to end with duration steps
  const [startH, startM] = dayConfig.start.split(':').map(Number);
  const [endH,   endM]   = dayConfig.end.split(':').map(Number);

  const slotStart = new Date(d);
  slotStart.setHours(startH, startM, 0, 0);
  const slotEnd = new Date(d);
  slotEnd.setHours(endH, endM, 0, 0);

  // Get existing sessions for this day
  const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);

  const bookedSessions = await Session.find({
    therapist: req.user._id,
    startTime: { $gte: dayStart, $lte: dayEnd },
    status:    { $nin: ['cancelled'] },
  }).select('startTime endTime');

  const slots = [];
  const dur   = parseInt(duration);
  let current = new Date(slotStart);

  while (current.getTime() + dur * 60000 <= slotEnd.getTime()) {
    const slotEndTime = new Date(current.getTime() + dur * 60000);
    const isBooked = bookedSessions.some(
      (s) => current < new Date(s.endTime) && slotEndTime > new Date(s.startTime)
    );
    slots.push({
      start:    current.toISOString(),
      end:      slotEndTime.toISOString(),
      available: !isBooked,
    });
    current = new Date(current.getTime() + 30 * 60000); // 30-min increments
  }

  return successResponse(res, { slots });
});

module.exports = { getAvailability, updateAvailability, getAvailableSlots };
