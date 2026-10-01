const Availability = require("../models/Availability");
const Session      = require("../models/Session");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { addMinutes, format, parseISO, startOfDay, endOfDay, isAfter, isBefore } = require("date-fns");
const { zonedTimeToUtc, utcToZonedTime } = require("date-fns-tz");

// GET /api/scheduling/:therapistId/slots?date=YYYY-MM-DD&duration=50&timezone=Asia/Kolkata
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { therapistId } = req.params;
  const { date, duration = 50, timezone = "Asia/Kolkata" } = req.query;

  if (!date) return errorResponse(res, "date query param required (YYYY-MM-DD)", 400);

  const avail = await Availability.findOne({ therapist: therapistId });
  if (!avail) return successResponse(res, { slots: [], reason: "Therapist has not set availability" });

  const d          = parseISO(date);
  const dayOfWeek  = d.getDay();
  const dayConfig  = avail.weekly.find((w) => w.day === dayOfWeek);

  if (!dayConfig || !dayConfig.enabled || !dayConfig.slots?.length) {
    return successResponse(res, { slots: [], reason: "Not a working day" });
  }

  // Check for override (full block)
  const override = avail.overrides.find((o) => {
    const od = new Date(o.date);
    return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate();
  });
  if (override?.isBlocked) {
    return successResponse(res, { slots: [], reason: "Day blocked by therapist" });
  }

  const slotDuration = Number(duration);
  const buffer       = avail.bufferTime || 10;

  // Get booked sessions for this day
  const dayStart = startOfDay(d);
  const dayEnd   = endOfDay(d);
  const booked   = await Session.find({
    therapist: therapistId,
    startTime: { $gte: dayStart, $lte: dayEnd },
    status:    { $nin: ["cancelled", "no_show"] },
  }).select("startTime endTime");

  const slots = [];
  for (const slot of dayConfig.slots) {
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    let current = new Date(d); current.setHours(sh, sm, 0, 0);
    const end   = new Date(d); end.setHours(eh, em, 0, 0);

    while (current.getTime() + slotDuration * 60000 <= end.getTime()) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      const overlap = booked.some(
        (b) => current < new Date(b.endTime) && slotEnd > new Date(b.startTime)
      );
      if (!overlap) {
        slots.push({
          start:    current.toISOString(),
          end:      slotEnd.toISOString(),
          available: true,
        });
      }
      current = new Date(current.getTime() + (slotDuration + buffer) * 60000);
    }
  }

  return successResponse(res, { slots, date, duration: slotDuration, timezone });
});

// GET /api/scheduling/:therapistId/availability
exports.getPublicAvailability = asyncHandler(async (req, res) => {
  const avail = await Availability.findOne({ therapist: req.params.therapistId })
    .select("-overrides");
  if (!avail) return errorResponse(res, "Availability not found", 404);
  return successResponse(res, { availability: avail });
});

// PUT /api/scheduling/availability  (therapist sets their own)
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { weekly, overrides, bufferTime, sessionDurations, defaultDuration, timezone } = req.body;
  const avail = await Availability.findOneAndUpdate(
    { therapist: req.user._id },
    { ...(weekly && { weekly }), ...(overrides && { overrides }),
      ...(bufferTime    !== undefined && { bufferTime }),
      ...(sessionDurations            && { sessionDurations }),
      ...(defaultDuration !== undefined && { defaultDuration }),
      ...(timezone                    && { timezone }) },
    { new: true, upsert: true, runValidators: true }
  );
  return successResponse(res, { availability: avail }, "Availability updated");
});

exports.getMyAvailability = asyncHandler(async (req, res) => {
  let avail = await Availability.findOne({ therapist: req.user._id });
  if (!avail) {
    avail = await Availability.create({
      therapist: req.user._id,
      weekly: [0,1,2,3,4,5,6].map((day) => ({
        day, enabled: day >= 1 && day <= 5,
        slots: day >= 1 && day <= 5 ? [{ start: "09:00", end: "17:00" }] : [],
      })),
    });
  }
  return successResponse(res, { availability: avail });
});